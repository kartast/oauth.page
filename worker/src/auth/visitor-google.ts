import { Hono } from "hono";
import { Env } from "../types";
import { createOAuthState } from "./state";

const visitorGoogle = new Hono<{ Bindings: Env }>();

// GET /api/visitor/auth/google?site=<slug> — redirect to Google OAuth (uses shared callback)
visitorGoogle.get("/", async (c) => {
  if (!c.env.GOOGLE_CLIENT_ID) {
    return c.text("Google OAuth not configured", 503);
  }
  const slug = c.req.query("site") || "";
  const state = await createOAuthState(c.env, { type: "visitor", slug });

  const params = new URLSearchParams({
    client_id: c.env.GOOGLE_CLIENT_ID,
    redirect_uri: `${c.env.APP_URL}/api/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    state,
  });
  return c.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

export default visitorGoogle;
