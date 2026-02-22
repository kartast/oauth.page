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
import filesApi from "./api/files";
import accessApi, { publicAccessApi } from "./api/access";
import cliAuth from "./api/cli-auth";

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
    origin: ["https://app.oauth.page", "https://oauth.page", "http://localhost:5173"],
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
app.route("/api/cli/auth", cliAuth);

// GET /api/auth/me — check current owner session
app.get("/api/auth/me", async (c) => {
  const cookies = c.req.header("cookie") || "";
  const authHeader = c.req.header("authorization") || "";

  let token: string | null = parseCookie(cookies, "gk_owner");
  if (!token && authHeader.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  }
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
app.route("/api/sites", filesApi);
app.route("/api/sites", accessApi);

// Catch-all for unknown API routes
app.all("/api/*", (c) => c.json({ error: "Not found" }, 404));

// Health check
app.get("/health", (c) => c.json({ status: "ok", timestamp: Date.now() }));

// --- Dashboard asset serving (KV-backed) ---
const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

async function serveDashboard(c: any, pathname: string): Promise<Response> {
  // Try exact asset match
  const ext = pathname.substring(pathname.lastIndexOf("."));
  const assetKey = `asset:${pathname}`;
  const asset = await c.env.KV.get(assetKey, "text");

  if (asset) {
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    const headers: Record<string, string> = {
      "Content-Type": contentType,
    };
    // Cache JS/CSS for 1 year (hashed filenames)
    if (ext === ".js" || ext === ".css") {
      headers["Cache-Control"] = "public, max-age=31536000, immutable";
    }
    return new Response(asset, { headers });
  }

  // SPA fallback → serve index.html
  const indexHtml = await c.env.KV.get("asset:/index.html", "text");
  if (indexHtml) {
    return new Response(indexHtml, {
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache" },
    });
  }

  return new Response("Dashboard not found", { status: 404 });
}

// Dashboard and landing page catch-all
app.all("*", async (c) => {
  const url = new URL(c.req.url);
  const host = url.hostname;
  const parts = host.split(".");
  const subdomain = parts[0];

  // app.oauth.page → serve dashboard
  if (subdomain === "app") {
    return serveDashboard(c, url.pathname);
  }

  // Root domain → serve dashboard too (landing = dashboard login page)
  if (parts.length < 3) {
    return serveDashboard(c, url.pathname);
  }

  return c.text("Not found", 404);
});

function parseCookie(cookieHeader: string, name: string): string | null {
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export default app;
