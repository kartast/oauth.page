import { Hono } from "hono";
import { Env, OwnerSession } from "../types";
import { createVisitorSession, revokeVisitorSessionsByEmail, getVisitorIdentity } from "../auth/session";
import { sendEmail, newAccessRequestEmail, accessApprovedEmail, accessDeniedEmail } from "../email";
import { getLimits, shouldResetMonthly, limitError } from "../limits";
import { lookupSite } from "../site-lookup";

const accessApi = new Hono<{ Bindings: Env; Variables: { owner: OwnerSession } }>();

// POST /api/access/request — visitor submits access request (requires visitor OAuth identity)
// This is mounted separately in the main router without auth middleware
export const publicAccessApi = new Hono<{ Bindings: Env }>();

publicAccessApi.post("/request", async (c) => {
  const contentType = c.req.header("content-type") || "";
  const cookies = c.req.header("cookie") || "";

  // Get visitor identity from cookie
  const visitorToken = parseCookie(cookies, "gk_visitor");
  if (!visitorToken) {
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await c.req.parseBody();
      const slug = formData.slug as string;
      return c.redirect(`https://${slug}.oauth.page?error=not_signed_in`);
    }
    return c.json({ error: "Not signed in. Please sign in with GitHub or Google first." }, 401);
  }

  const visitor = await getVisitorIdentity(c.env, visitorToken);
  if (!visitor) {
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await c.req.parseBody();
      const slug = formData.slug as string;
      return c.redirect(`https://${slug}.oauth.page?error=session_expired`);
    }
    return c.json({ error: "Visitor session expired. Please sign in again." }, 401);
  }

  let slug: string;
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const formData = await c.req.parseBody();
    slug = formData.slug as string;
  } else {
    const body = await c.req.json<{ slug: string }>();
    slug = body.slug;
  }

  if (!slug) {
    return c.json({ error: "Slug is required" }, 400);
  }

  // Look up site (KV cache → D1 fallback)
  const site = await lookupSite(slug, c.env);
  if (!site) {
    return c.json({ error: "Site not found" }, 404);
  }

  // Check for existing pending request
  const existing = await c.env.DB.prepare(
    "SELECT id FROM access_requests WHERE site_id = ? AND email = ? AND status = 'pending'"
  )
    .bind(site.id, visitor.email)
    .first();

  if (existing) {
    if (contentType.includes("application/x-www-form-urlencoded")) {
      return c.redirect(`https://${slug}.oauth.page/`);
    }
    return c.json({ message: "Access request already pending" }, 200);
  }

  // Check if already has active session
  const activeSession = await c.env.DB.prepare(
    "SELECT id FROM sessions WHERE site_id = ? AND email = ? AND expires_at > ?"
  )
    .bind(site.id, visitor.email, Math.floor(Date.now() / 1000))
    .first();

  if (activeSession) {
    if (contentType.includes("application/x-www-form-urlencoded")) {
      return c.redirect(`https://${slug}.oauth.page/`);
    }
    return c.json({ message: "You already have access" }, 200);
  }

  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  await c.env.DB.prepare(
    "INSERT INTO access_requests (id, site_id, email, name, message, status, avatar_url, provider, created_at) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?)"
  )
    .bind(id, site.id, visitor.email, visitor.name, null, visitor.avatar_url || null, visitor.provider, now)
    .run();

  // Update storage_bytes estimate for the site
  await updateStorageBytes(c.env.DB, site.id);

  // Notify site owner of new request (fire-and-forget, respects email limit)
  c.executionCtx.waitUntil(
    (async () => {
      try {
        const owner = await c.env.DB.prepare(
          "SELECT email, name FROM users WHERE id = ?"
        ).bind(site.owner_id).first<{ email: string; name: string }>();
        if (owner) {
          const canSend = await checkAndIncrementEmailLimit(c.env, site.owner_id);
          if (canSend) {
            const email = newAccessRequestEmail(
              owner.name || "there",
              visitor.name,
              visitor.email,
              site.name || slug,
              `${c.env.APP_URL}/sites/${site.id}`
            );
            email.to = owner.email;
            await sendEmail(c.env, email);
          }
        }
      } catch (err) {
        console.error("Failed to send new-request email:", err);
      }
    })()
  );

  if (contentType.includes("application/x-www-form-urlencoded")) {
    return c.redirect(`https://${slug}.oauth.page/`);
  }
  return c.json({ message: "Access request submitted", id }, 201);
});

// GET /api/sites/:id/requests — list access requests
accessApi.get("/:id/requests", async (c) => {
  const owner = c.get("owner");
  const siteId = c.req.param("id");

  // Verify ownership
  const site = await c.env.DB.prepare("SELECT id FROM sites WHERE id = ? AND owner_id = ?")
    .bind(siteId, owner.user_id)
    .first();
  if (!site) return c.json({ error: "Site not found" }, 404);

  const requests = await c.env.DB.prepare(
    "SELECT * FROM access_requests WHERE site_id = ? ORDER BY created_at DESC"
  )
    .bind(siteId)
    .all();

  return c.json({ requests: requests.results });
});

// POST /api/sites/:id/requests/:rid/approve
accessApi.post("/:id/requests/:rid/approve", async (c) => {
  const owner = c.get("owner");
  const siteId = c.req.param("id");
  const requestId = c.req.param("rid");

  // Verify ownership
  const site = await c.env.DB.prepare("SELECT * FROM sites WHERE id = ? AND owner_id = ?")
    .bind(siteId, owner.user_id)
    .first();
  if (!site) return c.json({ error: "Site not found" }, 404);

  // Get the request
  const request = await c.env.DB.prepare(
    "SELECT * FROM access_requests WHERE id = ? AND site_id = ?"
  )
    .bind(requestId, siteId)
    .first();
  if (!request) return c.json({ error: "Request not found" }, 404);
  if (request.status !== "pending") return c.json({ error: "Request already processed" }, 400);

  const now = Math.floor(Date.now() / 1000);

  // Update request status
  await c.env.DB.prepare(
    "UPDATE access_requests SET status = 'approved', decided_by = ?, decided_at = ? WHERE id = ?"
  )
    .bind(owner.user_id, now, requestId)
    .run();

  // Create visitor session in KV + D1 (visitor picks it up on next page load)
  await createVisitorSession(c.env, siteId, request.email as string);

  // Update storage_bytes estimate
  await updateStorageBytes(c.env.DB, siteId);

  // Notify visitor of approval (fire-and-forget, respects email limit)
  c.executionCtx.waitUntil(
    (async () => {
      try {
        const canSend = await checkAndIncrementEmailLimit(c.env, owner.user_id);
        if (canSend) {
          const siteSlug = site.slug as string;
          const email = accessApprovedEmail(
            (request.name as string) || "there",
            (site.name as string) || siteSlug,
            `https://${siteSlug}.oauth.page`
          );
          email.to = request.email as string;
          await sendEmail(c.env, email);
        }
      } catch (err) {
        console.error("Failed to send approval email:", err);
      }
    })()
  );

  return c.json({ ok: true, message: "Request approved. Visitor will get access on next visit." });
});

// POST /api/sites/:id/requests/:rid/deny
accessApi.post("/:id/requests/:rid/deny", async (c) => {
  const owner = c.get("owner");
  const siteId = c.req.param("id");
  const requestId = c.req.param("rid");

  const site = await c.env.DB.prepare("SELECT id FROM sites WHERE id = ? AND owner_id = ?")
    .bind(siteId, owner.user_id)
    .first();
  if (!site) return c.json({ error: "Site not found" }, 404);

  const request = await c.env.DB.prepare(
    "SELECT * FROM access_requests WHERE id = ? AND site_id = ?"
  )
    .bind(requestId, siteId)
    .first();
  if (!request) return c.json({ error: "Request not found" }, 404);
  if (request.status !== "pending") return c.json({ error: "Request already processed" }, 400);

  const now = Math.floor(Date.now() / 1000);
  await c.env.DB.prepare(
    "UPDATE access_requests SET status = 'denied', decided_by = ?, decided_at = ? WHERE id = ?"
  )
    .bind(owner.user_id, now, requestId)
    .run();

  // Notify visitor of denial (fire-and-forget, respects email limit)
  c.executionCtx.waitUntil(
    (async () => {
      try {
        const canSend = await checkAndIncrementEmailLimit(c.env, owner.user_id);
        if (canSend) {
          const siteRow = await c.env.DB.prepare("SELECT name, slug FROM sites WHERE id = ?")
            .bind(siteId).first<{ name: string; slug: string }>();
          const email = accessDeniedEmail(
            (request.name as string) || "there",
            siteRow?.name || siteRow?.slug || "the site"
          );
          email.to = request.email as string;
          await sendEmail(c.env, email);
        }
      } catch (err) {
        console.error("Failed to send denial email:", err);
      }
    })()
  );

  return c.json({ ok: true, message: "Request denied" });
});

// DELETE /api/sites/:id/access/:email — revoke access
accessApi.delete("/:id/access/:email", async (c) => {
  const owner = c.get("owner");
  const siteId = c.req.param("id");
  const email = decodeURIComponent(c.req.param("email"));

  const site = await c.env.DB.prepare("SELECT id FROM sites WHERE id = ? AND owner_id = ?")
    .bind(siteId, owner.user_id)
    .first();
  if (!site) return c.json({ error: "Site not found" }, 404);

  await revokeVisitorSessionsByEmail(c.env, siteId, email);

  // Update storage_bytes estimate
  await updateStorageBytes(c.env.DB, siteId);

  return c.json({ ok: true, message: "Access revoked" });
});

function parseCookie(cookieHeader: string, name: string): string | null {
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

const AVG_ROW_BYTES = 200;

async function updateStorageBytes(db: D1Database, siteId: string): Promise<void> {
  const result = await db.prepare(
    `SELECT 
      (SELECT COUNT(*) FROM access_requests WHERE site_id = ?) +
      (SELECT COUNT(*) FROM sessions WHERE site_id = ?) as row_count`
  )
    .bind(siteId, siteId)
    .first<{ row_count: number }>();

  const storageBytes = (result?.row_count ?? 0) * AVG_ROW_BYTES;
  await db.prepare("UPDATE sites SET storage_bytes = ? WHERE id = ?")
    .bind(storageBytes, siteId)
    .run();
}

/**
 * Check if the owner can send another email. If yes, increment counter and return true.
 * Performs lazy monthly reset.
 */
async function checkAndIncrementEmailLimit(env: Env, ownerId: string): Promise<boolean> {
  const { limits, user } = await getLimits(env, ownerId);
  if (limits.emailsPerMonth === -1) return true; // unlimited

  const now = Math.floor(Date.now() / 1000);
  let currentEmails = user.emails_this_month;

  if (shouldResetMonthly(user.deploys_reset_at)) {
    currentEmails = 0;
    await env.DB.prepare(
      "UPDATE users SET emails_this_month = 0, deploys_this_month = 0, deploys_reset_at = ? WHERE id = ?"
    )
      .bind(now, ownerId)
      .run();
  }

  if (currentEmails >= limits.emailsPerMonth) return false;

  await env.DB.prepare(
    "UPDATE users SET emails_this_month = emails_this_month + 1 WHERE id = ?"
  )
    .bind(ownerId)
    .run();
  return true;
}

export default accessApi;
