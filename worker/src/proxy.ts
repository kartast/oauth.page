import { Hono } from "hono";
import { Env, SiteConfig, SessionData, VisitorIdentity } from "./types";
import { renderGatePage } from "./gate";
import { verifyOwnerToken, getVisitorIdentity, setSessionCookie } from "./auth/session";
import { getMimeType, isHashed } from "./api/files";

const proxy = new Hono<{ Bindings: Env }>();

proxy.all("*", async (c) => {
  const url = new URL(c.req.url);
  const host = url.hostname;

  // Extract subdomain: <slug>.oauth.page
  const parts = host.split(".");
  if (parts.length < 3) {
    return c.redirect("https://app.oauth.page");
  }
  const slug = parts[0];

  if (slug === "app") {
    return c.text("Not found", 404);
  }

  // Look up site config from KV (fast edge lookup)
  const siteJson = await c.env.KV.get(`site:${slug}`);
  if (!siteJson) {
    return c.text("Site not found", 404);
  }

  const site: SiteConfig = JSON.parse(siteJson);
  const cookies = c.req.header("cookie") || "";

  // Helper: serve from R2 and track usage
  const serveAndTrack = async () => {
    const resp = await serveFromR2(c.env.STORAGE, site, url.pathname);
    const body = await resp.arrayBuffer();
    const bytesOut = body.byteLength;

    await c.env.DB.prepare(
      "UPDATE sites SET total_requests = total_requests + 1, total_bytes_out = total_bytes_out + ? WHERE id = ?"
    )
      .bind(bytesOut, site.id)
      .run();

    return new Response(body, {
      status: resp.status,
      statusText: resp.statusText,
      headers: resp.headers,
    });
  };

  // 1. Check visitor session cookie (already approved, fastest path)
  const sessionToken = parseCookie(cookies, "gk_session");
  if (sessionToken) {
    const sessionJson = await c.env.KV.get(`session:${sessionToken}`);
    if (sessionJson) {
      const session: SessionData = JSON.parse(sessionJson);
      if (session.site_id === site.id && session.expires_at > Math.floor(Date.now() / 1000)) {
        return serveAndTrack();
      }
    }
  }

  // 2. Check owner JWT — site owners always get through
  const ownerToken = parseCookie(cookies, "gk_owner");
  if (ownerToken) {
    const owner = await verifyOwnerToken(c.env, ownerToken);
    if (owner && owner.user_id === site.owner_id) {
      return serveAndTrack();
    }
  }

  // 3. Check visitor identity — auto-approve if they have an active session
  const visitorToken = parseCookie(cookies, "gk_visitor");
  let visitor: VisitorIdentity | null = null;

  if (visitorToken) {
    visitor = await getVisitorIdentity(c.env, visitorToken);
  }

  if (visitor) {
    // Owner logged in through visitor OAuth path should still be allowed instantly
    const ownerByEmail = await c.env.DB.prepare(
      "SELECT u.id FROM users u JOIN sites s ON s.owner_id = u.id WHERE s.id = ? AND lower(u.email) = lower(?) LIMIT 1"
    )
      .bind(site.id, visitor.email)
      .first();

    if (ownerByEmail) {
      return serveAndTrack();
    }

    const activeSession = await c.env.DB.prepare(
      "SELECT token FROM sessions WHERE site_id = ? AND email = ? AND expires_at > ?"
    )
      .bind(site.id, visitor.email, Math.floor(Date.now() / 1000))
      .first();

    if (activeSession) {
      const domain = `${slug}.oauth.page`;
      const response = await serveAndTrack();
      const newResponse = new Response(response.body, response);
      newResponse.headers.append("Set-Cookie", setSessionCookie(activeSession.token as string, domain));
      return newResponse;
    }

    // Not yet approved — check request status
    const request = await c.env.DB.prepare(
      "SELECT status FROM access_requests WHERE site_id = ? AND email = ? ORDER BY created_at DESC LIMIT 1"
    )
      .bind(site.id, visitor.email)
      .first();

    const requestStatus = (request?.status as "pending" | "approved" | "denied") || "none";

    return c.html(renderGatePage({ siteName: site.name, slug, visitor, requestStatus }), 200);
  }

  // 4. No auth at all — show sign-in gate
  return c.html(renderGatePage({ siteName: site.name, slug }), 200);
});

async function serveFromR2(storage: R2Bucket, site: SiteConfig, pathname: string): Promise<Response> {
  const path = pathname === "/" ? "/index.html" : pathname;
  const cleanPath = path.replace(/^\//, "").replace(/\.\./g, "").replace(/\0/g, "");
  const key = `u_${site.owner_id}/s_${site.id}/${cleanPath}`;

  const object = await storage.get(key);
  if (!object) {
    // SPA fallback — serve index.html for non-asset paths
    const indexKey = `u_${site.owner_id}/s_${site.id}/index.html`;
    const indexObj = await storage.get(indexKey);
    if (indexObj) {
      return new Response(indexObj.body, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-cache",
        },
      });
    }
    return new Response("Not found", { status: 404 });
  }

  const contentType = getMimeType(cleanPath);
  return new Response(object.body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": isHashed(cleanPath) ? "public, max-age=31536000, immutable" : "no-cache",
      "ETag": object.httpEtag,
    },
  });
}

export function parseCookie(cookieHeader: string, name: string): string | null {
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export default proxy;
