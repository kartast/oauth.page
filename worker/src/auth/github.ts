import { Hono } from "hono";
import { Env } from "../types";
import { createOwnerToken, setOwnerCookie, createVisitorIdentity, setVisitorCookie } from "./session";

const github = new Hono<{ Bindings: Env }>();

const CALLBACK_PATH = "/api/auth/github/callback";

// POST /api/auth/github — owner login (dashboard calls this)
github.post("/", (c) => {
  const state = btoa(JSON.stringify({ type: "owner" }));
  const params = new URLSearchParams({
    client_id: c.env.GITHUB_CLIENT_ID,
    redirect_uri: `${c.env.APP_URL}${CALLBACK_PATH}`,
    scope: "read:user user:email",
    state,
  });
  return c.json({ url: `https://github.com/login/oauth/authorize?${params}` });
});

// GET /api/auth/github/callback — unified callback for both owner and visitor
github.get("/callback", async (c) => {
  const code = c.req.query("code");
  const stateParam = c.req.query("state") || "";

  // Parse state to determine flow type
  let flowType = "owner";
  let siteSlug = "";
  let cliCode = "";
  try {
    const parsed = JSON.parse(atob(stateParam));
    flowType = parsed.type || "owner";
    siteSlug = parsed.slug || "";
    cliCode = parsed.code || "";
  } catch {}

  if (!code) {
    if (flowType === "visitor" && siteSlug) {
      return c.redirect(`https://${siteSlug}.oauth.page?error=missing_code`);
    }
    if (flowType === "cli") {
      return c.html(`<h1>OAuth failed</h1><p>Missing code. Return to terminal and run <code>oauthpage login</code> again.</p>`, 400);
    }
    return c.redirect(`${c.env.APP_URL}/login?error=missing_code`);
  }

  const errorRedirect = flowType === "visitor" && siteSlug
    ? `https://${siteSlug}.oauth.page`
    : flowType === "cli"
      ? `${c.env.APP_URL}/api/cli/auth/callback?code=${encodeURIComponent(cliCode)}`
      : `${c.env.APP_URL}/login`;

  try {
    // Exchange code for access token
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: c.env.GITHUB_CLIENT_ID,
        client_secret: c.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${c.env.APP_URL}${CALLBACK_PATH}`,
      }),
    });
    const tokenData: any = await tokenRes.json();

    console.error("[GITHUB_AUTH]", JSON.stringify(tokenData));
    if (!tokenData.access_token) {
      return c.redirect(`${errorRedirect}?error=token_exchange_failed`);
    }

    // Get user info
    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "User-Agent": "OAuthPage",
      },
    });
    const ghUser: any = await userRes.json();

    // Get primary email if not public
    let email = ghUser.email;
    if (!email) {
      const emailsRes = await fetch("https://api.github.com/user/emails", {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          "User-Agent": "OAuthPage",
        },
      });
      const emails: any[] = await emailsRes.json();
      const primary = emails.find((e) => e.primary && e.verified);
      email = primary?.email;
    }

    if (!email) {
      return c.redirect(`${errorRedirect}?error=no_email`);
    }

    // --- VISITOR FLOW ---
    if (flowType === "visitor") {
      const token = await createVisitorIdentity(c.env, {
        email,
        name: ghUser.name || ghUser.login,
        avatar_url: ghUser.avatar_url || "",
        provider: "github",
      });

      const redirectTo = siteSlug ? `https://${siteSlug}.oauth.page/` : `${c.env.APP_URL}`;
      return new Response(
        `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Logged in</title><style>body{font-family:system-ui,-apple-system,sans-serif;background:#0a0a0a;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}.card{max-width:420px;text-align:center;padding:24px;background:#111;border:1px solid #262626;border-radius:12px}.ok{font-size:28px;margin-bottom:8px}.muted{color:#f4f4f5;font-weight:600}</style></head><body><div class="card"><div class="ok">✓</div><h2>You’re logged in</h2><p class="muted">Redirecting you back to the site in <span id="countdown">3</span>s…</p><p><a href="${redirectTo}" style="color:#a78bfa">Continue now</a></p></div><script>(function(){let n=3;const el=document.getElementById("countdown");const t=setInterval(()=>{n--;if(el)el.textContent=String(n);if(n<=0){clearInterval(t);location.href=${JSON.stringify(redirectTo)};}},1000);})();</script></body></html>`,
        {
          status: 200,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Set-Cookie": setVisitorCookie(token),
          },
        }
      );
    }

    // --- OWNER FLOW ---
    const now = Math.floor(Date.now() / 1000);
    const existingUser = await c.env.DB.prepare(
      "SELECT * FROM users WHERE github_id = ? OR email = ?"
    )
      .bind(String(ghUser.id), email)
      .first();

    let userId: string;
    if (existingUser) {
      userId = existingUser.id as string;
      await c.env.DB.prepare(
        "UPDATE users SET name = ?, avatar_url = ?, github_id = ?, email = ? WHERE id = ?"
      )
        .bind(ghUser.name || ghUser.login, ghUser.avatar_url, String(ghUser.id), email, userId)
        .run();
    } else {
      userId = crypto.randomUUID();
      await c.env.DB.prepare(
        "INSERT INTO users (id, email, name, avatar_url, github_id, created_at) VALUES (?, ?, ?, ?, ?, ?)"
      )
        .bind(userId, email, ghUser.name || ghUser.login, ghUser.avatar_url, String(ghUser.id), now)
        .run();
    }

    const jwt = await createOwnerToken(c.env, {
      id: userId,
      email,
      name: ghUser.name || ghUser.login,
    });

    // --- CLI FLOW ---
    if (flowType === "cli" && cliCode) {
      await c.env.KV.put(
        `cli_auth:${cliCode}`,
        JSON.stringify({
          status: "complete",
          token: jwt,
          email,
          name: ghUser.name || ghUser.login,
        }),
        { expirationTtl: 300 }
      );

      return c.html(`
        <!DOCTYPE html>
        <html><head><title>OAuthPage CLI</title>
        <style>
          body{font-family:system-ui,sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#0a0a0a;color:#fff}
          .card{text-align:center;padding:2rem}
          .check{font-size:3rem;margin-bottom:1rem}
          h1{font-size:1.5rem;margin-bottom:.5rem}
          p{color:#888}
        </style></head>
        <body><div class="card"><div class="check">✓</div><h1>Authenticated!</h1><p>You can close this tab and return to your terminal.</p></div></body></html>
      `);
    }

    return new Response(null, {
      status: 302,
      headers: {
        Location: `${c.env.APP_URL}/sites`,
        "Set-Cookie": setOwnerCookie(jwt, undefined, new URL(c.req.url).hostname),
      },
    });
  } catch (err) {
    console.error("GitHub OAuth error:", err);
    return c.redirect(`${errorRedirect}?error=oauth_failed`);
  }
});

export default github;
