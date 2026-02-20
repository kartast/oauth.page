import { Hono } from "hono";
import { Env, SiteConfig, SessionData, VisitorIdentity } from "./types";
import { renderGatePage } from "./gate";
import { getVisitorIdentity, createVisitorSession, setSessionCookie } from "./auth/session";

const proxy = new Hono<{ Bindings: Env }>();

proxy.all("*", async (c) => {
  const url = new URL(c.req.url);
  const host = url.hostname;

  // Extract subdomain: <slug>.oauth.page
  const parts = host.split(".");
  if (parts.length < 3) {
    return c.text("Invalid request", 400);
  }
  const slug = parts[0];

  // Skip if it's the app subdomain
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

  // Check for session cookie (already approved)
  const sessionToken = parseCookie(cookies, "gk_session");

  if (sessionToken) {
    // Validate session from KV
    const sessionJson = await c.env.KV.get(`session:${sessionToken}`);
    if (sessionJson) {
      const session: SessionData = JSON.parse(sessionJson);
      if (session.site_id === site.id && session.expires_at > Math.floor(Date.now() / 1000)) {
        // Valid session — proxy the request
        return proxyToOrigin(c.req.raw, site.origin_url, url.pathname + url.search);
      }
    }
  }

  // Check for visitor identity cookie (signed in via OAuth but not yet approved)
  const visitorToken = parseCookie(cookies, "gk_visitor");
  let visitor: VisitorIdentity | null = null;

  if (visitorToken) {
    visitor = await getVisitorIdentity(c.env, visitorToken);
  }

  // If visitor is identified, check if they've been approved (email has active session)
  if (visitor) {
    const activeSession = await c.env.DB.prepare(
      "SELECT token FROM sessions WHERE site_id = ? AND email = ? AND expires_at > ?"
    )
      .bind(site.id, visitor.email, Math.floor(Date.now() / 1000))
      .first();

    if (activeSession) {
      // They've been approved! Set the session cookie and proxy
      const domain = `${slug}.oauth.page`;
      const response = await proxyToOrigin(c.req.raw, site.origin_url, url.pathname + url.search);
      const newResponse = new Response(response.body, response);
      newResponse.headers.append("Set-Cookie", setSessionCookie(activeSession.token as string, domain));
      return newResponse;
    }

    // Check request status
    const request = await c.env.DB.prepare(
      "SELECT status FROM access_requests WHERE site_id = ? AND email = ? ORDER BY created_at DESC LIMIT 1"
    )
      .bind(site.id, visitor.email)
      .first();

    const requestStatus = (request?.status as "pending" | "approved" | "denied") || "none";

    const html = renderGatePage({ siteName: site.name, slug, visitor, requestStatus });
    return c.html(html, 200);
  }

  // No session, no visitor identity — show OAuth sign-in page
  const html = renderGatePage({ siteName: site.name, slug });
  return c.html(html, 200);
});

async function proxyToOrigin(
  request: Request,
  originUrl: string,
  pathAndQuery: string
): Promise<Response> {
  const origin = originUrl.replace(/\/$/, "");
  const targetUrl = origin + pathAndQuery;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.set("X-Forwarded-For", headers.get("cf-connecting-ip") || "");
  headers.set("X-Forwarded-Proto", "https");

  const response = await fetch(targetUrl, {
    method: request.method,
    headers,
    body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
    redirect: "manual",
  });

  // Clone response headers, remove hop-by-hop
  const respHeaders = new Headers(response.headers);
  respHeaders.delete("transfer-encoding");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: respHeaders,
  });
}

function parseCookie(cookieHeader: string, name: string): string | null {
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export default proxy;
