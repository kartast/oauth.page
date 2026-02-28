import { Hono } from "hono";
import { Env, OwnerSession } from "../types";
import { getLimits, limitError } from "../limits";

const sitesApi = new Hono<{ Bindings: Env; Variables: { owner: OwnerSession } }>();

// GET /api/sites — list owner's sites
sitesApi.get("/", async (c) => {
  const owner = c.get("owner");

  const sites = await c.env.DB.prepare(
    `SELECT s.*, 
      (SELECT COUNT(*) FROM sessions WHERE site_id = s.id) as user_count,
      (SELECT COUNT(*) FROM access_requests WHERE site_id = s.id AND status = 'pending') as pending_count
    FROM sites s WHERE s.owner_id = ? ORDER BY s.created_at DESC`
  )
    .bind(owner.user_id)
    .all();

  return c.json({ sites: sites.results });
});

// POST /api/sites — create a new site
sitesApi.post("/", async (c) => {
  const owner = c.get("owner");
  const body = await c.req.json<{ name: string; slug?: string }>();

  if (!body.name) {
    return c.json({ error: "Name is required" }, 400);
  }

  // Plan-based site limit
  const { limits } = await getLimits(c.env, owner.user_id);
  const countRow = await c.env.DB.prepare("SELECT COUNT(*) as c FROM sites WHERE owner_id = ?")
    .bind(owner.user_id)
    .first<{ c: number }>();
  const activeCount = Number((countRow as any)?.c || 0);
  if (activeCount >= limits.sites) {
    return c.json(limitError("sites", activeCount, limits.sites), 403);
  }

  // Generate slug from name or use provided
  const slug = body.slug || body.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 63);

  // Check slug uniqueness
  const existing = await c.env.DB.prepare("SELECT id FROM sites WHERE slug = ?")
    .bind(slug)
    .first();
  if (existing) {
    return c.json({ error: "Slug already taken" }, 409);
  }

  // Reserved slugs
  if (["app", "www", "api", "admin", "mail", "smtp"].includes(slug)) {
    return c.json({ error: "This slug is reserved" }, 409);
  }

  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  await c.env.DB.prepare(
    "INSERT INTO sites (id, owner_id, slug, origin_url, name, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  )
    .bind(id, owner.user_id, slug, "", body.name, now)
    .run();

  // Cache in KV for fast edge lookups
  const siteConfig = { id, slug, name: body.name, owner_id: owner.user_id };
  await c.env.KV.put(`site:${slug}`, JSON.stringify(siteConfig));

  return c.json({ site: { id, slug, name: body.name, created_at: now } }, 201);
});

// GET /api/sites/requests — list all pending requests for all owner's sites
sitesApi.get("/requests", async (c) => {
  const owner = c.get("owner");

  const requests = await c.env.DB.prepare(
    `SELECT ar.*, s.name as site_name, s.slug as site_slug
     FROM access_requests ar
     JOIN sites s ON ar.site_id = s.id
     WHERE s.owner_id = ? AND ar.status = 'pending'
     ORDER BY ar.created_at DESC`
  )
    .bind(owner.user_id)
    .all();

  return c.json({ requests: requests.results });
});

// GET /api/sites/:id — get site details
sitesApi.get("/:id", async (c) => {
  const owner = c.get("owner");
  const siteId = c.req.param("id");

  const site = await c.env.DB.prepare(
    `SELECT s.*,
      (SELECT COUNT(*) FROM sessions WHERE site_id = s.id) as user_count,
      (SELECT COUNT(*) FROM access_requests WHERE site_id = s.id AND status = 'pending') as pending_count
    FROM sites s WHERE s.id = ? AND s.owner_id = ?`
  )
    .bind(siteId, owner.user_id)
    .first();

  if (!site) {
    return c.json({ error: "Site not found" }, 404);
  }

  // Get approved users (active sessions)
  const approvedUsers = await c.env.DB.prepare(
    "SELECT DISTINCT email FROM sessions WHERE site_id = ? AND expires_at > ?"
  )
    .bind(siteId, Math.floor(Date.now() / 1000))
    .all();

  // Get all access requests
  const requests = await c.env.DB.prepare(
    "SELECT * FROM access_requests WHERE site_id = ? ORDER BY created_at DESC"
  )
    .bind(siteId)
    .all();

  return c.json({
    site,
    approved_users: approvedUsers.results,
    requests: requests.results,
  });
});

// DELETE /api/sites/:id — delete a site
sitesApi.delete("/:id", async (c) => {
  const owner = c.get("owner");
  const siteId = c.req.param("id");

  const site = await c.env.DB.prepare("SELECT * FROM sites WHERE id = ? AND owner_id = ?")
    .bind(siteId, owner.user_id)
    .first();

  if (!site) {
    return c.json({ error: "Site not found" }, 404);
  }

  // Clean up KV
  await c.env.KV.delete(`site:${site.slug}`);

  // Clean up R2 files
  const prefix = `u_${owner.user_id}/s_${siteId}/`;
  let cursor: string | undefined;
  do {
    const listed = await c.env.STORAGE.list({ prefix, limit: 1000, cursor });
    if (listed.objects.length > 0) {
      await c.env.STORAGE.delete(listed.objects.map((o) => o.key));
    }
    cursor = listed.truncated ? listed.cursor : undefined;
  } while (cursor);

  // Delete sessions from KV
  const sessions = await c.env.DB.prepare("SELECT token FROM sessions WHERE site_id = ?")
    .bind(siteId)
    .all();
  for (const s of sessions.results) {
    await c.env.KV.delete(`session:${(s as any).token}`);
  }

  // Delete from D1 (cascade manually)
  await c.env.DB.prepare("DELETE FROM sessions WHERE site_id = ?").bind(siteId).run();
  await c.env.DB.prepare("DELETE FROM access_requests WHERE site_id = ?").bind(siteId).run();
  await c.env.DB.prepare("DELETE FROM sites WHERE id = ?").bind(siteId).run();

  return c.json({ ok: true });
});

export default sitesApi;
