import { Hono } from "hono";
import { Env } from "../types";
import { createOwnerToken, setOwnerCookie } from "./session";

const github = new Hono<{ Bindings: Env }>();

// POST /api/auth/github — redirect to GitHub OAuth
github.post("/", (c) => {
  const params = new URLSearchParams({
    client_id: c.env.GITHUB_CLIENT_ID,
    redirect_uri: `${c.env.APP_URL}/api/auth/github/callback`,
    scope: "read:user user:email",
  });
  return c.json({ url: `https://github.com/login/oauth/authorize?${params}` });
});

// GET /api/auth/github/callback — exchange code for token
github.get("/callback", async (c) => {
  const code = c.req.query("code");
  if (!code) {
    return c.redirect(`${c.env.APP_URL}/login?error=missing_code`);
  }

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
      }),
    });
    const tokenData: any = await tokenRes.json();

    if (!tokenData.access_token) {
      return c.redirect(`${c.env.APP_URL}/login?error=token_exchange_failed`);
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
      return c.redirect(`${c.env.APP_URL}/login?error=no_email`);
    }

    // Upsert user in D1
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

    // Create JWT
    const jwt = await createOwnerToken(c.env, {
      id: userId,
      email,
      name: ghUser.name || ghUser.login,
    });

    return new Response(null, {
      status: 302,
      headers: {
        Location: `${c.env.APP_URL}/sites`,
        "Set-Cookie": setOwnerCookie(jwt),
      },
    });
  } catch (err) {
    console.error("GitHub OAuth error:", err);
    return c.redirect(`${c.env.APP_URL}/login?error=oauth_failed`);
  }
});

export default github;
