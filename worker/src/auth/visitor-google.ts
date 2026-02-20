import { Hono } from "hono";
import { Env } from "../types";
import { createVisitorIdentity, setVisitorCookie } from "./session";

const visitorGoogle = new Hono<{ Bindings: Env }>();

// GET /api/visitor/auth/google?site=<slug> — redirect to Google OAuth
visitorGoogle.get("/", (c) => {
  const slug = c.req.query("site") || "";
  const state = btoa(JSON.stringify({ slug, type: "visitor" }));

  const params = new URLSearchParams({
    client_id: c.env.GOOGLE_CLIENT_ID,
    redirect_uri: `${c.env.APP_URL}/api/visitor/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    state,
  });
  return c.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

// GET /api/visitor/auth/google/callback — exchange code, create visitor identity
visitorGoogle.get("/callback", async (c) => {
  const code = c.req.query("code");
  const stateParam = c.req.query("state") || "";

  let slug = "";
  try {
    const parsed = JSON.parse(atob(stateParam));
    slug = parsed.slug || "";
  } catch {}

  if (!code) {
    return c.redirect(slug ? `https://${slug}.oauth.page?error=missing_code` : `${c.env.APP_URL}?error=missing_code`);
  }

  const redirectBase = slug ? `https://${slug}.oauth.page` : c.env.APP_URL;

  try {
    // Exchange code for access token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: c.env.GOOGLE_CLIENT_ID,
        client_secret: c.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${c.env.APP_URL}/api/visitor/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });
    const tokenData: any = await tokenRes.json();

    if (!tokenData.access_token) {
      return c.redirect(`${redirectBase}?error=token_exchange_failed`);
    }

    // Get user info
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const gUser: any = await userRes.json();

    if (!gUser.email) {
      return c.redirect(`${redirectBase}?error=no_email`);
    }

    // Create visitor identity in KV
    const token = await createVisitorIdentity(c.env, {
      email: gUser.email,
      name: gUser.name || gUser.email,
      avatar_url: gUser.picture || "",
      provider: "google",
    });

    // Redirect back to the gate page with visitor cookie
    return new Response(null, {
      status: 302,
      headers: {
        Location: `${redirectBase}/`,
        "Set-Cookie": setVisitorCookie(token),
      },
    });
  } catch (err) {
    console.error("Visitor Google OAuth error:", err);
    return c.redirect(`${redirectBase}?error=oauth_failed`);
  }
});

export default visitorGoogle;
