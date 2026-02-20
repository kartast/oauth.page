import { Hono } from "hono";
import { Env } from "../types";
import { createOwnerToken, setOwnerCookie } from "./session";

const google = new Hono<{ Bindings: Env }>();

// POST /api/auth/google — redirect to Google OAuth
google.post("/", (c) => {
  const params = new URLSearchParams({
    client_id: c.env.GOOGLE_CLIENT_ID,
    redirect_uri: `${c.env.APP_URL}/api/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
  });
  return c.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
});

// GET /api/auth/google/callback — exchange code for token
google.get("/callback", async (c) => {
  const code = c.req.query("code");
  if (!code) {
    return c.redirect(`${c.env.APP_URL}/login?error=missing_code`);
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: c.env.GOOGLE_CLIENT_ID,
        client_secret: c.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${c.env.APP_URL}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });
    const tokenData: any = await tokenRes.json();

    if (!tokenData.access_token) {
      return c.redirect(`${c.env.APP_URL}/login?error=token_exchange_failed`);
    }

    // Get user info
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const gUser: any = await userRes.json();

    if (!gUser.email) {
      return c.redirect(`${c.env.APP_URL}/login?error=no_email`);
    }

    // Upsert user in D1
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

    // Create JWT
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
    return c.redirect(`${c.env.APP_URL}/login?error=oauth_failed`);
  }
});

export default google;
