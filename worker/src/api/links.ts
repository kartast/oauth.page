import { Hono } from "hono";
import { Env, OwnerSession } from "../types";
import { generateToken } from "../auth/session";

const linksApi = new Hono<{ Bindings: Env; Variables: { owner: OwnerSession } }>();

function linksEnabled(env: Env): boolean {
  return String(env.BETA_ONE_TIME_LINKS || "false").toLowerCase() === "true";
}

const DEFAULT_TTL_SECONDS = 60 * 60; // 1 hour
const MAX_TTL_SECONDS = 24 * 60 * 60; // 24 hours
const MIN_TTL_SECONDS = 60; // 1 minute

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function normalizePath(path: string | undefined): string {
  if (!path || !path.trim()) return "/";
  let p = path.trim();
  if (!p.startsWith("/")) p = `/${p}`;
  if (p.includes("..") || p.includes("\0")) return "/";
  return p;
}

// POST /api/sites/:id/links (beta)
linksApi.post("/:id/links", async (c) => {
  if (!linksEnabled(c.env)) return c.json({ error: "One-time links beta is disabled" }, 404);
  const owner = c.get("owner");
  const siteId = c.req.param("id");
  const body = await c.req.json<{ path?: string; ttl_seconds?: number }>().catch(() => ({}));

  const site = await c.env.DB.prepare("SELECT id, slug, owner_id FROM sites WHERE id = ? AND owner_id = ?")
    .bind(siteId, owner.user_id)
    .first<{ id: string; slug: string; owner_id: string }>();
  if (!site) return c.json({ error: "Site not found" }, 404);

  const ttl = Math.max(MIN_TTL_SECONDS, Math.min(MAX_TTL_SECONDS, body.ttl_seconds || DEFAULT_TTL_SECONDS));
  const path = normalizePath(body.path);

  const token = generateToken();
  const tokenHash = await sha256Hex(token);
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + ttl;
  const id = crypto.randomUUID();

  await c.env.DB.prepare(
    `INSERT INTO one_time_links
      (id, site_id, token_hash, path, expires_at, max_uses, uses_count, status, created_by, created_at)
     VALUES (?, ?, ?, ?, ?, 1, 0, 'active', ?, ?)`
  )
    .bind(id, site.id, tokenHash, path, expiresAt, owner.user_id, now)
    .run();

  const url = `https://${site.slug}.oauth.page/_otl/${token}`;

  return c.json({
    beta: true,
    link: {
      id,
      url,
      path,
      expires_at: expiresAt,
      max_uses: 1,
      status: "active",
    },
  }, 201);
});

// GET /api/sites/:id/links
linksApi.get("/:id/links", async (c) => {
  if (!linksEnabled(c.env)) return c.json({ error: "One-time links beta is disabled" }, 404);
  const owner = c.get("owner");
  const siteId = c.req.param("id");

  const site = await c.env.DB.prepare("SELECT id FROM sites WHERE id = ? AND owner_id = ?")
    .bind(siteId, owner.user_id)
    .first();
  if (!site) return c.json({ error: "Site not found" }, 404);

  const links = await c.env.DB.prepare(
    `SELECT id, path, expires_at, max_uses, uses_count, status, created_at, consumed_at
     FROM one_time_links
     WHERE site_id = ?
     ORDER BY created_at DESC
     LIMIT 100`
  )
    .bind(siteId)
    .all();

  return c.json({ beta: true, links: links.results });
});

// POST /api/sites/:id/links/:linkId/revoke
linksApi.post("/:id/links/:linkId/revoke", async (c) => {
  if (!linksEnabled(c.env)) return c.json({ error: "One-time links beta is disabled" }, 404);
  const owner = c.get("owner");
  const siteId = c.req.param("id");
  const linkId = c.req.param("linkId");

  const site = await c.env.DB.prepare("SELECT id FROM sites WHERE id = ? AND owner_id = ?")
    .bind(siteId, owner.user_id)
    .first();
  if (!site) return c.json({ error: "Site not found" }, 404);

  await c.env.DB.prepare(
    `UPDATE one_time_links SET status = 'revoked'
     WHERE id = ? AND site_id = ? AND status = 'active'`
  )
    .bind(linkId, siteId)
    .run();

  return c.json({ ok: true, beta: true });
});

export { sha256Hex };
export default linksApi;
