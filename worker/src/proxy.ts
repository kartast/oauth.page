import { Hono } from "hono";
import { Env, SiteConfig, SessionData, VisitorIdentity } from "./types";
import { renderGatePage } from "./gate";
import { verifyOwnerToken, getVisitorIdentity, setSessionCookie, setOwnerCookie, setVisitorCookie, createVisitorSession } from "./auth/session";
import { getMimeType, isHashed } from "./api/files";
import { sha256Hex } from "./api/links";

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

  // One-time link consume flow (BETA): /_otl/<token>
  const otlMatch = url.pathname.match(/^\/_otl\/([a-f0-9]{32,})$/i);
  if (otlMatch) {
    return handleOneTimeLink(c, site, slug, otlMatch[1], url);
  }

  const cookies = c.req.header("cookie") || "";
  const debugInterstitial = url.searchParams.get("debug_interstitial") === "1";

  const redirectWithoutDebug = () => {
    const u = new URL(c.req.url);
    u.searchParams.delete("debug_interstitial");
    return u.toString();
  };

  const renderDebugInterstitial = (to: string, extraHeaders: Record<string, string> = {}) =>
    new Response(
      `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Debug Redirect</title><style>body{font-family:system-ui,-apple-system,sans-serif;background:#0a0a0a;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}.card{max-width:480px;text-align:center;padding:24px;background:#111;border:1px solid #262626;border-radius:12px}.ok{font-size:28px;margin-bottom:8px}.muted{color:#f4f4f5;font-weight:600}</style></head><body><div class="card"><div class="ok">✓</div><h2>Debug: Auth detected</h2><p class="muted">Redirecting to <code>${to}</code> in <span id="countdown">3</span>s…</p><p><a href="${to}" style="color:#a78bfa">Continue now</a></p></div><script>(function(){let n=3;const el=document.getElementById("countdown");const t=setInterval(()=>{n--;if(el)el.textContent=String(n);if(n<=0){clearInterval(t);location.href=${JSON.stringify(to)};}},1000);})();</script></body></html>`,
      {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          ...extraHeaders,
        },
      }
    );

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
        const domain = `${slug}.oauth.page`;
        if (debugInterstitial) {
          return renderDebugInterstitial(redirectWithoutDebug(), {
            "Set-Cookie": setSessionCookie(sessionToken, domain),
          });
        }
        const response = await serveAndTrack();
        const refreshed = new Response(response.body, response);
        refreshed.headers.append("Set-Cookie", setSessionCookie(sessionToken, domain));
        return refreshed;
      }
    }
  }

  // 2. Check owner JWT — site owners always get through
  const ownerToken = parseCookie(cookies, "gk_owner");
  if (ownerToken) {
    const owner = await verifyOwnerToken(c.env, ownerToken);
    if (owner && owner.user_id === site.owner_id) {
      if (debugInterstitial) {
        return renderDebugInterstitial(redirectWithoutDebug(), {
          "Set-Cookie": setOwnerCookie(ownerToken),
        });
      }
      const response = await serveAndTrack();
      const refreshed = new Response(response.body, response);
      refreshed.headers.append("Set-Cookie", setOwnerCookie(ownerToken));
      return refreshed;
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
      if (debugInterstitial) {
        return renderDebugInterstitial(redirectWithoutDebug(), {
          "Set-Cookie": setVisitorCookie(visitorToken as string),
        });
      }
      const response = await serveAndTrack();
      const refreshed = new Response(response.body, response);
      refreshed.headers.append("Set-Cookie", setVisitorCookie(visitorToken as string));
      return refreshed;
    }

    const activeSession = await c.env.DB.prepare(
      "SELECT token FROM sessions WHERE site_id = ? AND email = ? AND expires_at > ?"
    )
      .bind(site.id, visitor.email, Math.floor(Date.now() / 1000))
      .first();

    if (activeSession) {
      const domain = `${slug}.oauth.page`;
      if (debugInterstitial) {
        const interstitial = renderDebugInterstitial(redirectWithoutDebug(), {
          "Set-Cookie": setSessionCookie(activeSession.token as string, domain),
        });
        interstitial.headers.append("Set-Cookie", setVisitorCookie(visitorToken as string));
        return interstitial;
      }
      const response = await serveAndTrack();
      const newResponse = new Response(response.body, response);
      newResponse.headers.append("Set-Cookie", setSessionCookie(activeSession.token as string, domain));
      newResponse.headers.append("Set-Cookie", setVisitorCookie(visitorToken as string));
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

async function handleOneTimeLink(
  c: any,
  site: SiteConfig,
  slug: string,
  token: string,
  url: URL
): Promise<Response> {
  const now = Math.floor(Date.now() / 1000);
  const tokenHash = await sha256Hex(token);

  const link = await c.env.DB.prepare(
    `SELECT id, path, expires_at, status, max_uses, uses_count
     FROM one_time_links
     WHERE site_id = ? AND token_hash = ?
     LIMIT 1`
  )
    .bind(site.id, tokenHash)
    .first<any>();

  if (!link) {
    return c.html(renderOneTimeInfo("Invalid link", "This one-time link is invalid or has been removed."), 404);
  }
  if (link.status !== "active") {
    return c.html(renderOneTimeInfo("Link unavailable", "This one-time link has already been used or revoked."), 410);
  }
  if (link.expires_at <= now) {
    return c.html(renderOneTimeInfo("Link expired", "This one-time link has expired. Ask the owner for a new one."), 410);
  }

  // Anti-prefetch confirm step (BETA safety)
  if (url.searchParams.get("confirm") !== "1") {
    const confirmUrl = new URL(url.toString());
    confirmUrl.searchParams.set("confirm", "1");
    return c.html(renderOneTimeConfirm(confirmUrl.toString()), 200);
  }

  const ip = c.req.header("cf-connecting-ip") || "";
  const ua = (c.req.header("user-agent") || "").slice(0, 500);

  const result = await c.env.DB.prepare(
    `UPDATE one_time_links
       SET uses_count = uses_count + 1,
           status = 'consumed',
           consumed_at = ?,
           consumed_ip = ?,
           consumed_ua = ?
     WHERE id = ? AND status = 'active' AND expires_at > ? AND uses_count < max_uses`
  )
    .bind(now, ip, ua, link.id, now)
    .run();

  const changed = (result as any)?.meta?.changes || 0;
  if (!changed) {
    return c.html(renderOneTimeInfo("Link unavailable", "This one-time link was just consumed or expired."), 410);
  }

  const minted = await createVisitorSession(c.env, site.id, `otl+${link.id}@guest.oauth.page`);
  const targetPath = typeof link.path === "string" && link.path.startsWith("/") ? link.path : "/";
  const redirectTo = `https://${slug}.oauth.page${targetPath}`;

  return new Response(null, {
    status: 302,
    headers: {
      Location: redirectTo,
      "Set-Cookie": setSessionCookie(minted.token, `${slug}.oauth.page`),
    },
  });
}

function renderOneTimeConfirm(confirmUrl: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>One-time link (BETA)</title><style>body{font-family:system-ui,-apple-system,sans-serif;background:#0a0a0a;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}.card{max-width:460px;text-align:center;padding:24px;background:#111;border:1px solid #262626;border-radius:12px}.muted{color:#d4d4d8}.btn{display:inline-block;margin-top:12px;padding:10px 14px;border-radius:10px;background:#8b5cf6;color:#fff;text-decoration:none;font-weight:600}</style></head><body><div class="card"><h2>One-time access link (BETA)</h2><p class="muted">This link can be used only once. Click continue to enter the site.</p><a class="btn" href="${confirmUrl}">Continue</a></div></body></html>`;
}

function renderOneTimeInfo(title: string, message: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${title}</title><style>body{font-family:system-ui,-apple-system,sans-serif;background:#0a0a0a;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}.card{max-width:460px;text-align:center;padding:24px;background:#111;border:1px solid #262626;border-radius:12px}.muted{color:#d4d4d8}</style></head><body><div class="card"><h2>${title}</h2><p class="muted">${message}</p></div></body></html>`;
}

export function parseCookie(cookieHeader: string, name: string): string | null {
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export default proxy;
