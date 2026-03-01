import { Hono } from "hono";
import { Env, OwnerSession } from "../types";
import { getLimits, shouldResetMonthly, limitError, PLAN_LIMITS } from "../limits";

const MAX_FILE_SIZE = 26214400; // 25MB per file
const BLOCKED_EXTENSIONS = new Set([".exe", ".sh", ".bat", ".cmd", ".ps1", ".msi", ".dll"]);

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".xml": "application/xml",
  ".webmanifest": "application/manifest+json",
  ".map": "application/json",
};

export function getMimeType(path: string): string {
  const ext = path.substring(path.lastIndexOf(".")).toLowerCase();
  return MIME_TYPES[ext] || "application/octet-stream";
}

export function isHashed(path: string): boolean {
  // Match common hashed filenames: foo.a1b2c3d4.js, foo-HASH.css
  return /\.[a-f0-9]{8,}\.(js|css|woff2?|ttf)$/i.test(path);
}

function sanitizePath(path: string): string | null {
  // Remove null bytes
  let clean = path.replace(/\0/g, "");
  // Remove leading slashes
  clean = clean.replace(/^\/+/, "");
  // Block path traversal
  if (clean.includes("..")) return null;
  // Block empty paths
  if (!clean || clean === "/") return null;
  // Check extension
  const ext = clean.substring(clean.lastIndexOf(".")).toLowerCase();
  if (BLOCKED_EXTENSIONS.has(ext)) return null;
  return clean;
}

function r2Key(ownerId: string, siteId: string, path: string): string {
  return `u_${ownerId}/s_${siteId}/${path}`;
}


async function getOwnerStorageBytes(env: Env, ownerId: string): Promise<number> {
  const row = await env.DB.prepare("SELECT COALESCE(SUM(storage_bytes), 0) as total FROM sites WHERE owner_id = ?")
    .bind(ownerId)
    .first<{ total: number }>();
  return Number((row as any)?.total || 0);
}

const filesApi = new Hono<{ Bindings: Env; Variables: { owner: OwnerSession } }>();

// GET /api/sites/:id/files — list files
filesApi.get("/:id/files", async (c) => {
  const owner = c.get("owner");
  const siteId = c.req.param("id");

  // Verify ownership
  const site = await c.env.DB.prepare("SELECT * FROM sites WHERE id = ? AND owner_id = ?")
    .bind(siteId, owner.user_id)
    .first();
  if (!site) return c.json({ error: "Site not found" }, 404);

  const prefix = r2Key(owner.user_id, siteId, "");
  const listed = await c.env.STORAGE.list({ prefix, limit: 1000 });

  const files = listed.objects.map((obj) => ({
    path: obj.key.replace(prefix, ""),
    size: obj.size,
    lastModified: obj.uploaded.toISOString(),
  }));

  return c.json({ files });
});

// PUT /api/sites/:id/files/* — upload single file
filesApi.put("/:id/files/*", async (c) => {
  const owner = c.get("owner");
  const siteId = c.req.param("id");

  // Extract path from URL (everything after /files/)
  const url = new URL(c.req.url);
  const match = url.pathname.match(/\/api\/sites\/[^/]+\/files\/(.+)/);
  if (!match) return c.json({ error: "File path required" }, 400);

  const filePath = sanitizePath(decodeURIComponent(match[1]));
  if (!filePath) return c.json({ error: "Invalid or blocked file path" }, 400);

  // Verify ownership
  const site = await c.env.DB.prepare("SELECT * FROM sites WHERE id = ? AND owner_id = ?")
    .bind(siteId, owner.user_id)
    .first();
  if (!site) return c.json({ error: "Site not found" }, 404);

  // Read body
  const body = await c.req.arrayBuffer();
  if (body.byteLength > MAX_FILE_SIZE) {
    return c.json({ error: "File too large (max 25MB)" }, 413);
  }

  // Check plan total storage quota (account-wide)
  const { limits } = await getLimits(c.env, owner.user_id);
  const maxStorage = limits.storageMb * 1024 * 1024;
  const key = r2Key(owner.user_id, siteId, filePath);
  const existing = await c.env.STORAGE.head(key);
  const existingSize = existing?.size || 0;
  const ownerStorage = await getOwnerStorageBytes(c.env, owner.user_id);
  const projectedStorage = ownerStorage - existingSize + body.byteLength;
  if (projectedStorage > maxStorage) {
    const currentMb = Math.round(ownerStorage / 1024 / 1024 * 10) / 10;
    return c.json(limitError("storageMb", currentMb, limits.storageMb), 403);
  }

  const contentType = getMimeType(filePath);

  await c.env.STORAGE.put(key, body, {
    httpMetadata: { contentType },
  });

  // Recalculate storage
  const storageBytes = await calculateStorage(c.env.STORAGE, owner.user_id, siteId);
  await c.env.DB.prepare("UPDATE sites SET storage_bytes = ? WHERE id = ?")
    .bind(storageBytes, siteId)
    .run();

  // Auto-trigger screenshot via queue (debounce: skip if captured within last 60s)
  const thumbAt = (site.thumbnail_at as number) || 0;
  if (Math.floor(Date.now() / 1000) - thumbAt > 60) {
    await c.env.SCREENSHOT_QUEUE.send({
      siteId,
      slug: site.slug as string,
      ownerId: owner.user_id,
    });
    await c.env.DB.prepare("UPDATE sites SET thumbnail_status = 'pending' WHERE id = ?")
      .bind(siteId).run();
  }

  return c.json({ ok: true, path: filePath, size: body.byteLength });
});

// DELETE /api/sites/:id/files/* — delete single file
filesApi.delete("/:id/files/*", async (c) => {
  const owner = c.get("owner");
  const siteId = c.req.param("id");

  const url = new URL(c.req.url);
  const match = url.pathname.match(/\/api\/sites\/[^/]+\/files\/(.+)/);
  if (!match) return c.json({ error: "File path required" }, 400);

  const filePath = sanitizePath(decodeURIComponent(match[1]));
  if (!filePath) return c.json({ error: "Invalid file path" }, 400);

  // Verify ownership
  const site = await c.env.DB.prepare("SELECT * FROM sites WHERE id = ? AND owner_id = ?")
    .bind(siteId, owner.user_id)
    .first();
  if (!site) return c.json({ error: "Site not found" }, 404);

  const key = r2Key(owner.user_id, siteId, filePath);
  await c.env.STORAGE.delete(key);

  // Recalculate storage
  const storageBytes = await calculateStorage(c.env.STORAGE, owner.user_id, siteId);
  await c.env.DB.prepare("UPDATE sites SET storage_bytes = ? WHERE id = ?")
    .bind(storageBytes, siteId)
    .run();

  return c.json({ ok: true });
});

// POST /api/sites/:id/deploy — bulk upload
filesApi.post("/:id/deploy", async (c) => {
  const owner = c.get("owner");
  const siteId = c.req.param("id");

  // Verify ownership
  const site = await c.env.DB.prepare("SELECT * FROM sites WHERE id = ? AND owner_id = ?")
    .bind(siteId, owner.user_id)
    .first();
  if (!site) return c.json({ error: "Site not found" }, 404);

  const body = await c.req.json<{ files: { path: string; content_base64: string }[] }>();

  if (!body.files || !Array.isArray(body.files)) {
    return c.json({ error: "files array required" }, 400);
  }

  // Calculate total size
  let totalSize = 0;
  const decoded: { path: string; data: ArrayBuffer }[] = [];

  for (const file of body.files) {
    const filePath = sanitizePath(file.path);
    if (!filePath) {
      return c.json({ error: `Invalid or blocked path: ${file.path}` }, 400);
    }

    const binary = Uint8Array.from(atob(file.content_base64), (ch) => ch.charCodeAt(0));
    if (binary.byteLength > MAX_FILE_SIZE) {
      return c.json({ error: `File too large: ${file.path} (max 25MB)` }, 413);
    }
    totalSize += binary.byteLength;
    decoded.push({ path: filePath, data: binary.buffer });
  }

  // Check plan total storage quota (account-wide)
  const { limits, user } = await getLimits(c.env, owner.user_id);
  const maxStorage = limits.storageMb * 1024 * 1024;
  const ownerTotalStorage = await getOwnerStorageBytes(c.env, owner.user_id);
  const currentSiteStorage = Number((site as any).storage_bytes || 0);
  const projectedStorage = ownerTotalStorage - currentSiteStorage + totalSize;
  if (projectedStorage > maxStorage) {
    const currentMb = Math.round(ownerTotalStorage / 1024 / 1024 * 10) / 10;
    return c.json(limitError("storageMb", currentMb, limits.storageMb), 403);
  }

  // Check deploy limit with lazy monthly reset
  const now = Math.floor(Date.now() / 1000);
  let currentDeploys = user.deploys_this_month;
  if (shouldResetMonthly(user.deploys_reset_at)) {
    currentDeploys = 0;
    await c.env.DB.prepare(
      "UPDATE users SET deploys_this_month = 0, deploys_reset_at = ? WHERE id = ?"
    )
      .bind(now, owner.user_id)
      .run();
  }
  if (currentDeploys >= limits.deploysPerMonth) {
    return c.json(limitError("deploysPerMonth", currentDeploys, limits.deploysPerMonth), 403);
  }

  // Delete all existing files first (deploy = replace, not additive)
  const prefix = r2Key(owner.user_id, siteId, "");
  let cursor: string | undefined;
  do {
    const listed = await c.env.STORAGE.list({ prefix, limit: 1000, cursor });
    if (listed.objects.length > 0) {
      await c.env.STORAGE.delete(listed.objects.map((o) => o.key));
    }
    cursor = listed.truncated ? listed.cursor : undefined;
  } while (cursor);

  // Upload all files
  for (const file of decoded) {
    const key = r2Key(owner.user_id, siteId, file.path);
    const contentType = getMimeType(file.path);
    await c.env.STORAGE.put(key, file.data, {
      httpMetadata: { contentType },
    });
  }

  // Increment deploy counter
  await c.env.DB.prepare(
    "UPDATE users SET deploys_this_month = deploys_this_month + 1, deploys_reset_at = COALESCE(deploys_reset_at, ?) WHERE id = ?"
  )
    .bind(now, owner.user_id)
    .run();

  // Recalculate storage
  const storageBytes = await calculateStorage(c.env.STORAGE, owner.user_id, siteId);
  await c.env.DB.prepare("UPDATE sites SET storage_bytes = ? WHERE id = ?")
    .bind(storageBytes, siteId)
    .run();

  // Auto-trigger screenshot via queue (debounce: skip if captured within last 60s)
  // Free plan: only on first deploy (thumbnail_status IS NULL)
  const thumbAt = (site.thumbnail_at as number) || 0;
  const canScreenshot = limits.screenshotOnEveryDeploy || !(site.thumbnail_status);
  if (canScreenshot && Math.floor(Date.now() / 1000) - thumbAt > 60) {
    await c.env.SCREENSHOT_QUEUE.send({
      siteId,
      slug: site.slug as string,
      ownerId: owner.user_id,
    });
    await c.env.DB.prepare("UPDATE sites SET thumbnail_status = 'pending' WHERE id = ?")
      .bind(siteId).run();
  }

  // Invalidate markdown site caches (sidebar + detection)
  await c.env.KV.delete(`md_site:${siteId}`);
  await c.env.KV.delete(`sidebar:${siteId}`);

  return c.json({ ok: true, count: decoded.length, totalSize });
});

async function calculateStorage(storage: R2Bucket, ownerId: string, siteId: string): Promise<number> {
  const prefix = r2Key(ownerId, siteId, "");
  let total = 0;
  let cursor: string | undefined;

  do {
    const listed = await storage.list({ prefix, limit: 1000, cursor });
    for (const obj of listed.objects) {
      total += obj.size;
    }
    cursor = listed.truncated ? listed.cursor : undefined;
  } while (cursor);

  return total;
}

export default filesApi;
