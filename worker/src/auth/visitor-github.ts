import { Hono } from "hono";
import { Env } from "../types";
import { createVisitorIdentity, setVisitorCookie } from "./session";

const visitorGithub = new Hono<{ Bindings: Env }>();

// GET /api/visitor/auth/github?site=<slug> — redirect to GitHub OAuth
visitorGithub.get("/", (c) => {
  const slug = c.req.query("site") || "";
  const state = btoa(JSON.stringify({ slug, type: "visitor" }));

  const params = new URLSearchParams({
    client_id: c.env.GITHUB_CLIENT_ID,
    redirect_uri: `${c.env.APP_URL}/api/visitor/auth/github/callback`,
    scope: "read:user user:email",
    state,
  });
  return c.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

// GET /api/visitor/auth/github/callback — exchange code, create visitor identity
visitorGithub.get("/callback", async (c) => {
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
        redirect_uri: `${c.env.APP_URL}/api/visitor/auth/github/callback`,
      }),
    });
    const tokenData: any = await tokenRes.json();

    if (!tokenData.access_token) {
      return c.redirect(`${redirectBase}?error=token_exchange_failed`);
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
      return c.redirect(`${redirectBase}?error=no_email`);
    }

    // Create visitor identity in KV
    const token = await createVisitorIdentity(c.env, {
      email,
      name: ghUser.name || ghUser.login,
      avatar_url: ghUser.avatar_url || "",
      provider: "github",
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
    console.error("Visitor GitHub OAuth error:", err);
    return c.redirect(`${redirectBase}?error=oauth_failed`);
  }
});

export default visitorGithub;
