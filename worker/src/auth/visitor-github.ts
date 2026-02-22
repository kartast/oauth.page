import { Hono } from "hono";
import { Env } from "../types";

const visitorGithub = new Hono<{ Bindings: Env }>();

// GET /api/visitor/auth/github?site=<slug> — redirect to GitHub OAuth (uses shared callback)
visitorGithub.get("/", (c) => {
  const slug = c.req.query("site") || "";
  const state = btoa(JSON.stringify({ slug, type: "visitor" }));

  const params = new URLSearchParams({
    client_id: c.env.GITHUB_CLIENT_ID,
    redirect_uri: `${c.env.APP_URL}/api/auth/github/callback`,
    scope: "read:user user:email",
    state,
  });
  return c.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

export default visitorGithub;
