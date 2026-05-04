import { Hono } from "hono";
import { Env, SiteConfig, SessionData, VisitorIdentity } from "./types";
import { renderGatePage } from "./gate";
import { verifyOwnerToken, getVisitorIdentity, setSessionCookie, setOwnerCookie, setVisitorCookie, createVisitorSession } from "./auth/session";
import { getMimeType, isHashed } from "./api/files";
import { sha256Hex } from "./api/links";
import { PLAN_LIMITS, shouldResetMonthly } from "./limits";
import { lookupSite } from "./site-lookup";

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

  // Look up site config (KV cache → D1 fallback)
  const site = await lookupSite(slug, c.env);
  if (!site) {
    return c.text("Site not found", 404);
  }

  // Screenshot bypass — one-time token via header, no auth or usage tracking
  const screenshotToken = c.req.header("x-gk-screenshot");
  if (screenshotToken) {
    const expectedSiteId = await c.env.KV.get(`ss:${screenshotToken}`);
    if (expectedSiteId === site.id) {
      // Let token expire naturally (60s TTL) so subresource requests also bypass gate
      return serveFromR2(c.env.STORAGE, site, url.pathname, c.env);
    }
  }

  // One-time link consume flow (BETA): /_otl/<token>
  const otlMatch = url.pathname.match(/^\/_otl\/([a-f0-9]{32,})$/i);
  if (otlMatch) {
    const enabled = String(c.env.BETA_ONE_TIME_LINKS || "false").toLowerCase() === "true";
    if (!enabled) return c.text("Not found", 404);
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

  // Helper: check view limit and serve from R2
  const checkViewLimit = async (): Promise<Response | null> => {
    // Look up owner plan
    const ownerRow = await c.env.DB.prepare(
      "SELECT plan FROM users WHERE id = ?"
    )
      .bind(site.owner_id)
      .first<{ plan: string }>();
    const plan = ownerRow?.plan || "free";
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

    // Get site view counters
    const siteRow = await c.env.DB.prepare(
      "SELECT views_this_month, views_reset_at FROM sites WHERE id = ?"
    )
      .bind(site.id)
      .first<{ views_this_month: number; views_reset_at: number | null }>();

    let views = siteRow?.views_this_month ?? 0;
    const now = Math.floor(Date.now() / 1000);

    // Lazy monthly reset
    if (shouldResetMonthly(siteRow?.views_reset_at ?? null)) {
      views = 0;
      await c.env.DB.prepare(
        "UPDATE sites SET views_this_month = 0, views_reset_at = ? WHERE id = ?"
      )
        .bind(now, site.id)
        .run();
    }

    if (views >= limits.viewsPerSite) {
      return new Response(renderViewsExceeded(site.name), {
        status: 429,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // Batch writes: use KV counter, only flush to DB every 10th view
    const kvKey = `views:${site.id}`;
    const kvCount = parseInt(await c.env.KV.get(kvKey) || "0", 10);
    const newCount = kvCount + 1;
    if (newCount >= 10) {
      await c.env.DB.prepare(
        "UPDATE sites SET views_this_month = views_this_month + ? WHERE id = ?"
      )
        .bind(newCount, site.id)
        .run();
      await c.env.KV.delete(kvKey);
    } else {
      await c.env.KV.put(kvKey, String(newCount), { expirationTtl: 86400 });
    }

    return null;
  };

  // Helper: serve from R2 and track usage
  const serveAndTrack = async () => {
    // Check view limit before serving
    const viewBlock = await checkViewLimit();
    if (viewBlock) return viewBlock;

    const resp = await serveFromR2(c.env.STORAGE, site, url.pathname, c.env);
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

async function serveFromR2(storage: R2Bucket, site: SiteConfig, pathname: string, env?: Env): Promise<Response> {
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

    // Markdown site: no index.html → generate Docsify shell
    if (env) {
      const isMarkdownSite = await checkMarkdownSite(storage, site, env);
      if (isMarkdownSite) {
        if (cleanPath === "index.html") {
          return serveDocsifyShell(site);
        }
        if (cleanPath === "_sidebar.md") {
          return await serveAutoSidebar(storage, site, env);
        }
      }
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

async function checkMarkdownSite(storage: R2Bucket, site: SiteConfig, env: Env): Promise<boolean> {
  const cacheKey = `md_site:${site.id}`;
  const cached = await env.KV.get(cacheKey);
  if (cached !== null) return cached === "1";

  const prefix = `u_${site.owner_id}/s_${site.id}/`;
  let hasMd = false;
  let hasHtml = false;
  let cursor: string | undefined;

  do {
    const list = await storage.list({ prefix, limit: 1000, cursor });
    for (const obj of list.objects) {
      if (obj.key.endsWith(".md")) hasMd = true;
      if (obj.key.endsWith(".html")) hasHtml = true;
      if (hasMd && hasHtml) break;
    }
    if (hasMd && hasHtml) break;
    cursor = list.truncated ? list.cursor : undefined;
  } while (cursor);

  const isMarkdown = hasMd && !hasHtml;
  await env.KV.put(cacheKey, isMarkdown ? "1" : "0", { expirationTtl: 3600 });
  return isMarkdown;
}

function serveDocsifyShell(site: SiteConfig): Response {
  const title = site.name || "Docs";
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1">
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" id="theme-link" href="https://cdn.jsdelivr.net/npm/docsify-themeable@0.9.0/dist/css/theme-simple-dark.css" integrity="sha384-G+RAlt+LEfAH/nY+DZh3+XIhRboypMI32hiJ9BwnmjF41May5BWQKyrDrEkNdV/i" crossorigin="anonymous">
  <style>
    :root{--theme-color:#a78bfa;--link-color:#a78bfa;--link-color--hover:#c4b5fd;--sidebar-nav-link-color--active:#a78bfa;--sidebar-name-color:#a78bfa;--sidebar-name-font-weight:700;--base-font-size:15px;--sidebar-width:260px}
    .theme-btn{position:fixed;bottom:1rem;right:1rem;z-index:999;background:var(--theme-color);color:#fff;border:none;border-radius:50%;width:36px;height:36px;font-size:16px;cursor:pointer;opacity:.7;transition:opacity .2s}.theme-btn:hover{opacity:1}
  </style>
</head>
<body>
  <div id="app">Loading...</div>
  <button class="theme-btn" onclick="toggleTheme()" title="Toggle theme">◐</button>
  <script>
    var themes={
      dark:{url:'https://cdn.jsdelivr.net/npm/docsify-themeable@0.9.0/dist/css/theme-simple-dark.css',sri:'sha384-G+RAlt+LEfAH/nY+DZh3+XIhRboypMI32hiJ9BwnmjF41May5BWQKyrDrEkNdV/i'},
      light:{url:'https://cdn.jsdelivr.net/npm/docsify-themeable@0.9.0/dist/css/theme-simple.css',sri:'sha384-IuZucGNxm+6VGvZLv3+oxh1kE70WlIXci7p3g/Dtchij0oKFb9s8zG9GYnIkl8CB'}
    };
    var current=localStorage.getItem('op-theme')||'dark';
    function applyTheme(name){
      var t=themes[name];
      var link=document.getElementById('theme-link');
      link.href=t.url;
      link.integrity=t.sri;
      link.crossOrigin='anonymous';
    }
    if(current==='light')applyTheme('light');
    function toggleTheme(){current=current==='dark'?'light':'dark';applyTheme(current);localStorage.setItem('op-theme',current)}
    window.\$docsify={name:'${escapeHtml(title).replace(/'/g,"\\'")}',loadSidebar:true,subMaxLevel:3,auto2top:true,search:{placeholder:'Search',noData:'No results',depth:3},copyCode:{buttonText:'Copy',successText:'Copied'}};
  </script>
  <script src="https://cdn.jsdelivr.net/npm/docsify@4.13.1/lib/docsify.min.js" integrity="sha384-KaHhgnx/OTLoJ4J33SSJsF4x1pk4I7q3s5ZOfIDHJYl6IG7Oyn2vNDsHiWJe46fD" crossorigin="anonymous"></script>
  <script src="https://cdn.jsdelivr.net/npm/docsify@4.13.1/lib/plugins/search.min.js" integrity="sha384-LthJPBJ4RGco78kBY+EmKz5rmISZ5vrtAu3+l2ALQ2mrZHOe6Wyf6knyKjeC4cL6" crossorigin="anonymous"></script>
  <script src="https://cdn.jsdelivr.net/npm/docsify-copy-code@2.1.1/dist/docsify-copy-code.min.js" integrity="sha384-t4d9b4/0dEBkoJ5e77XEPBrqJ790jbFQFmEaTbBqIlTDeGosM1AbZvC1NQwqTg+5" crossorigin="anonymous"></script>
  <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-bash.min.js" integrity="sha384-9WmlN8ABpoFSSHvBGGjhvB3E/D8UkNB9HpLJjBQFC2VSQsM1odiQDv4NbEo+7l15" crossorigin="anonymous"></script>
  <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-json.min.js" integrity="sha384-RhrmFFMb0ZCHImjFMpR/UE3VEtIVTCtNrtKQqXCzqXZNJala02N3UbVhi+qzw3CY" crossorigin="anonymous"></script>
  <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-typescript.min.js" integrity="sha384-PeOqKNW/piETaCg8rqKFy+Pm6KEk7e36/5YZE5XO/OaFdO+/Aw3O8qZ9qDPKVUgx" crossorigin="anonymous"></script>
  <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-python.min.js" integrity="sha384-WJdEkJKrbsqw0evQ4GB6mlsKe5cGTxBOw4KAEIa52ZLB7DDpliGkwdme/HMa5n1m" crossorigin="anonymous"></script>
</body>
</html>`;
  const csp = [
    "default-src 'self'",
    "img-src 'self' data: https:",
    "font-src 'self' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'none'",
  ].join('; ');

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache",
      "Content-Security-Policy": csp,
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

async function serveAutoSidebar(storage: R2Bucket, site: SiteConfig, env: Env): Promise<Response> {
  // Check KV cache first
  const cacheKey = `sidebar:${site.id}`;
  const cached = await env.KV.get(cacheKey);
  if (cached) {
    return new Response(cached, {
      headers: { "Content-Type": "text/markdown; charset=utf-8", "Cache-Control": "no-cache" },
    });
  }

  const prefix = `u_${site.owner_id}/s_${site.id}/`;
  const mdFiles: string[] = [];
  let cursor: string | undefined;

  do {
    const list = await storage.list({ prefix, limit: 1000, cursor });
    mdFiles.push(
      ...list.objects
        .map((o) => o.key.replace(prefix, ""))
        .filter((k) => k.endsWith(".md") && !k.startsWith("_"))
    );
    cursor = list.truncated ? list.cursor : undefined;
  } while (cursor);

  mdFiles.sort();

  const lines: string[] = [];
  for (const file of mdFiles) {
    const name = file.replace(/\.md$/, "");
    if (name === "README") {
      lines.unshift("- [Home](/)");
    } else {
      const rawTitle = name
        .split("/")
        .pop()!
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (ch: string) => ch.toUpperCase());
      // Sanitize: strip anything that could break markdown/HTML
      const title = rawTitle.replace(/[\[\]()\\<>"']/g, "");
      const safeName = name.replace(/[\[\]()\\<>"']/g, "");
      lines.push(`- [${title}](/${safeName})`);
    }
  }

  const sidebar = lines.join("\n") + "\n";
  await env.KV.put(cacheKey, sidebar, { expirationTtl: 3600 });

  return new Response(sidebar, {
    headers: { "Content-Type": "text/markdown; charset=utf-8", "Cache-Control": "no-cache" },
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
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>One-time link (BETA)</title><style>body{font-family:system-ui,-apple-system,sans-serif;background:#0a0a0a;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}.card{max-width:460px;text-align:center;padding:24px;background:#111;border:1px solid #262626;border-radius:12px}.muted{color:#d4d4d8}.btn{display:inline-block;margin-top:12px;padding:10px 14px;border-radius:10px;background:#8b5cf6;color:#fff;text-decoration:none;font-weight:600}</style></head><body><div class="card"><h2>One-time access link (BETA)</h2><p class="muted">This link can be used only once. Click continue to enter the site.</p><a class="btn" href="${escapeHtml(confirmUrl)}">Continue</a></div></body></html>`;
}

function renderOneTimeInfo(title: string, message: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${title}</title><style>body{font-family:system-ui,-apple-system,sans-serif;background:#0a0a0a;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}.card{max-width:460px;text-align:center;padding:24px;background:#111;border:1px solid #262626;border-radius:12px}.muted{color:#d4d4d8}</style></head><body><div class="card"><h2>${escapeHtml(title)}</h2><p class="muted">${escapeHtml(message)}</p></div></body></html>`;
}

function renderViewsExceeded(siteName: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Views Exceeded</title><style>body{font-family:system-ui,-apple-system,sans-serif;background:#0a0a0a;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}.card{max-width:460px;text-align:center;padding:24px;background:#111;border:1px solid #262626;border-radius:12px}.muted{color:#d4d4d8}.btn{display:inline-block;margin-top:12px;padding:10px 14px;border-radius:10px;background:#8b5cf6;color:#fff;text-decoration:none;font-weight:600}</style></head><body><div class="card"><h2>${escapeHtml(siteName)}</h2><p class="muted">This site has exceeded its monthly view limit. The site owner can upgrade to restore access.</p><a class="btn" href="https://oauth.page/pricing">Learn more</a></div></body></html>`;
}

export function parseCookie(cookieHeader: string, name: string): string | null {
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export default proxy;


function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
