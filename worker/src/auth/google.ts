import { Hono } from "hono";
import { Env } from "../types";
import { createOwnerToken, setOwnerCookie, createVisitorIdentity, setVisitorCookie } from "./session";

const google = new Hono<{ Bindings: Env }>();

const CALLBACK_PATH = "/api/auth/google/callback";

// POST /api/auth/google — owner login (dashboard calls this)
google.post("/", (c) => {
  if (!c.env.GOOGLE_CLIENT_ID) {
    return c.json({ error: "Google OAuth not configured" }, 503);
  }
  const state = btoa(JSON.stringify({ type: "owner" }));
  const params = new URLSearchParams({
    client_id: c.env.GOOGLE_CLIENT_ID,
    redirect_uri: `${c.env.APP_URL}${CALLBACK_PATH}`,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    state,
  });
  return c.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
});

// GET /api/auth/google/callback — unified callback for both owner and visitor
google.get("/callback", async (c) => {
  const code = c.req.query("code");
  const stateParam = c.req.query("state") || "";

  let flowType = "owner";
  let siteSlug = "";
  try {
    const parsed = JSON.parse(atob(stateParam));
    flowType = parsed.type || "owner";
    siteSlug = parsed.slug || "";
  } catch {}

  if (!code) {
    if (flowType === "visitor" && siteSlug) {
      return c.redirect(`https://${siteSlug}.oauth.page?error=missing_code`);
    }
    return c.redirect(`${c.env.APP_URL}/login?error=missing_code`);
  }

  const errorRedirect = flowType === "visitor" && siteSlug
    ? `https://${siteSlug}.oauth.page`
    : `${c.env.APP_URL}/login`;

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: c.env.GOOGLE_CLIENT_ID,
        client_secret: c.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${c.env.APP_URL}${CALLBACK_PATH}`,
        grant_type: "authorization_code",
      }),
    });
    const tokenData: any = await tokenRes.json();

    if (!tokenData.access_token) {
      return c.redirect(`${errorRedirect}?error=token_exchange_failed`);
    }

    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const gUser: any = await userRes.json();

    if (!gUser.email) {
      return c.redirect(`${errorRedirect}?error=no_email`);
    }

    // --- VISITOR FLOW ---
    if (flowType === "visitor") {
      const token = await createVisitorIdentity(c.env, {
        email: gUser.email,
        name: gUser.name || gUser.email,
        avatar_url: gUser.picture || "",
        provider: "google",
      });

      const redirectTo = siteSlug ? `https://${siteSlug}.oauth.page/` : `${c.env.APP_URL}`;
      return new Response(
        `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Logged in</title><style>body{font-family:system-ui,-apple-system,sans-serif;background:#0a0a0a;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}.card{max-width:420px;text-align:center;padding:24px;background:#111;border:1px solid #262626;border-radius:12px}.ok{font-size:28px;margin-bottom:8px}.muted{color:#a1a1aa}</style></head><body><div class="card"><div class="ok">✓</div><h2>You’re logged in</h2><p class="muted">Redirecting you back to the site…</p><p><a href="${redirectTo}" style="color:#a78bfa">Continue now</a></p></div><script>(function(){const to=${JSON.stringify(redirectTo)};let host='global';try{host=new URL(to).hostname||'global'}catch{}const k='gk_redirect_seen_'+host;const seen=localStorage.getItem(k)==='1';if(seen){location.href=to;return;}localStorage.setItem(k,'1');setTimeout(()=>location.href=to,900);})();</script></body></html>`,
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
      "SELECT * FROM users WHERE google_id = ? OR email = ?"
    )
      .bind(gUser.id, gUser.email)
      .first();

    let userId: string;
    if (existingUser) {
      userId = existingUser.id as string;
      await c.env.DB.prepare(
        "UPDATE users SET name = ?, avatar_url = ?, google_id = ?, email = ? WHERE id = ?"
      )
        .bind(gUser.name, gUser.picture, gUser.id, gUser.email, userId)
        .run();
    } else {
      userId = crypto.randomUUID();
      await c.env.DB.prepare(
        "INSERT INTO users (id, email, name, avatar_url, google_id, created_at) VALUES (?, ?, ?, ?, ?, ?)"
      )
        .bind(userId, gUser.email, gUser.name, gUser.picture, gUser.id, now)
        .run();
    }

    const jwt = await createOwnerToken(c.env, {
      id: userId,
      email: gUser.email,
      name: gUser.name,
    });

    return new Response(null, {
      status: 302,
      headers: {
        Location: `${c.env.APP_URL}/sites`,
        "Set-Cookie": setOwnerCookie(jwt),
      },
    });
  } catch (err) {
    console.error("Google OAuth error:", err);
    return c.redirect(`${errorRedirect}?error=oauth_failed`);
  }
});

export default google;
