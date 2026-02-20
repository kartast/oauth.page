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

  // Root domain → redirect to dashboard
  const parts = host.split(".");
  if (parts.length < 3) {
    return c.redirect("https://app.oauth.page");
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

function parseCookie(cookieHeader: string, name: string): string | null {
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export default app;
