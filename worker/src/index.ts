import { Hono } from "hono";
import { cors } from "hono/cors";
import { Env, OwnerSession } from "./types";
import proxy from "./proxy";
import github from "./auth/github";
import google from "./auth/google";
import visitorGithub from "./auth/visitor-github";
import visitorGoogle from "./auth/visitor-google";
import { verifyOwnerToken } from "./auth/session";
import sitesApi from "./api/sites";
import accessApi, { publicAccessApi } from "./api/access";

const app = new Hono<{ Bindings: Env }>();

// Determine if this is API traffic (app.oauth.page) or proxy traffic
app.use("*", async (c, next) => {
  const host = new URL(c.req.url).hostname;
  const subdomain = host.split(".")[0];

  if (subdomain === "app") {
    // API/Dashboard traffic
    return next();
  }

  // Root domain → same as app
  const parts = host.split(".");
  if (parts.length < 3) {
    return next();
  }

  // Proxy traffic — handle directly
  return proxy.fetch(c.req.raw, c.env, c.executionCtx);
});

// CORS for API routes (dashboard cross-origin)
app.use(
  "/api/*",
  cors({
    origin: ["https://app.oauth.page", "http://localhost:5173"],
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

// --- Public routes (no auth) ---
app.route("/api/auth/github", github);
app.route("/api/auth/google", google);
app.route("/api/visitor/auth/github", visitorGithub);
app.route("/api/visitor/auth/google", visitorGoogle);
app.route("/api/access", publicAccessApi);

// GET /api/auth/me — check current owner session
app.get("/api/auth/me", async (c) => {
  const cookies = c.req.header("cookie") || "";
  const token = parseCookie(cookies, "gk_owner");
  if (!token) return c.json({ user: null }, 401);

  const session = await verifyOwnerToken(c.env, token);
  if (!session) return c.json({ user: null }, 401);

  return c.json({
    user: {
      id: session.user_id,
      email: session.email,
      name: session.name,
    },
  });
});

// POST /api/auth/logout
app.post("/api/auth/logout", (c) => {
  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie":
        "gk_owner=; Path=/; Domain=.oauth.page; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
    },
  });
});

// --- Auth middleware for protected API routes ---
app.use("/api/sites/*", async (c, next) => {
  const cookies = c.req.header("cookie") || "";
  const authHeader = c.req.header("authorization") || "";

  let token: string | null = parseCookie(cookies, "gk_owner");
  if (!token && authHeader.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  }

  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const session = await verifyOwnerToken(c.env, token);
  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("owner" as never, session as never);
  return next();
});

// --- Protected routes ---
app.route("/api/sites", sitesApi);
app.route("/api/sites", accessApi);

// Catch-all for unknown API routes
app.all("/api/*", (c) => c.json({ error: "Not found" }, 404));

// Health check
app.get("/health", (c) => c.json({ status: "ok", timestamp: Date.now() }));

// Landing page for app.oauth.page
app.get("/", (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>OAuthPage — Protect any site with OAuth</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0a0a0a;color:#fff;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px}
.logo{font-size:32px;font-weight:800;letter-spacing:-1px;margin-bottom:8px}
.logo span{color:#8b5cf6}
.sub{color:#737373;font-size:16px;margin-bottom:40px;text-align:center;max-width:400px;line-height:1.5}
.card{background:#141414;border:1px solid #262626;border-radius:16px;padding:32px;max-width:420px;width:100%;text-align:center}
.card h2{font-size:18px;font-weight:700;margin-bottom:8px}
.card p{color:#737373;font-size:14px;margin-bottom:24px;line-height:1.5}
.btn{display:inline-flex;align-items:center;gap:8px;padding:12px 24px;border-radius:10px;font-size:14px;font-weight:600;text-decoration:none;border:none;cursor:pointer;transition:opacity .2s}
.btn:hover{opacity:.9}
.btn-primary{background:#8b5cf6;color:#fff}
.btn-github{background:#24292e;color:#fff}
.steps{margin-top:40px;display:flex;flex-direction:column;gap:16px;max-width:400px;width:100%}
.step{display:flex;gap:12px;align-items:flex-start}
.step-num{background:#8b5cf6;color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0}
.step-text{font-size:14px;color:#a3a3a3;line-height:1.4}
.step-text strong{color:#fff}
.footer{margin-top:48px;color:#525252;font-size:12px}
</style></head><body>
<div class="logo">OAuth<span>.page</span></div>
<div class="sub">Protect any website with OAuth. Like Google Docs sharing, but for any site.</div>
<div class="card">
  <h2>Get Started</h2>
  <p>Sign in to create your first protected site. Your visitors will use GitHub or Google to request access.</p>
  <a href="/api/auth/github" class="btn btn-github">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
    Sign in with GitHub
  </a>
</div>
<div class="steps">
  <div class="step"><div class="step-num">1</div><div class="step-text"><strong>Add your site URL</strong> — paste your origin URL and get a protected subdomain</div></div>
  <div class="step"><div class="step-num">2</div><div class="step-text"><strong>Share the link</strong> — visitors sign in with GitHub/Google to request access</div></div>
  <div class="step"><div class="step-num">3</div><div class="step-text"><strong>Approve or deny</strong> — one click from your dashboard</div></div>
</div>
<div class="footer">Powered by Cloudflare Edge · Zero code changes needed</div>
</body></html>`);
});

function parseCookie(cookieHeader: string, name: string): string | null {
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export default app;
