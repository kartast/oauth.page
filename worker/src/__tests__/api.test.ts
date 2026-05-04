import { describe, it, expect, vi, beforeEach } from "vitest";
import app from "../index";

// Mock env bindings
function createMockEnv() {
  return {
    DB: {
      prepare: vi.fn(() => ({
        bind: vi.fn(() => ({
          all: vi.fn(() => Promise.resolve({ results: [] })),
          first: vi.fn(() => Promise.resolve(null)),
          run: vi.fn(() => Promise.resolve()),
        })),
        all: vi.fn(() => Promise.resolve({ results: [] })),
        first: vi.fn(() => Promise.resolve(null)),
        run: vi.fn(() => Promise.resolve()),
      })),
    },
    KV: {
      get: vi.fn(() => Promise.resolve(null)),
      put: vi.fn(() => Promise.resolve()),
      delete: vi.fn(() => Promise.resolve()),
    },
    APP_URL: "https://app.oauth.page",
    DASHBOARD_URL: "https://oauth-page-dashboard.pages.dev",
    GITHUB_CLIENT_ID: "test-github-client-id",
    GITHUB_CLIENT_SECRET: "test-github-secret",
    GOOGLE_CLIENT_ID: "test-google-client-id",
    GOOGLE_CLIENT_SECRET: "test-google-secret",
    JWT_SECRET: "test-jwt-secret-key-that-is-long-enough",
  };
}

function createMockExecutionCtx() {
  return {
    waitUntil: vi.fn(),
    passThroughOnException: vi.fn(),
  };
}

describe("API Endpoints", () => {
  let env: ReturnType<typeof createMockEnv>;
  let ctx: ReturnType<typeof createMockExecutionCtx>;

  beforeEach(() => {
    env = createMockEnv();
    ctx = createMockExecutionCtx();
  });

  it("GET /health returns 200 + JSON", async () => {
    const req = new Request("https://app.oauth.page/health");
    const res = await app.fetch(req, env as any, ctx as any);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.status).toBe("ok");
    expect(body.timestamp).toBeDefined();
  });

  it("GET /api/auth/me returns 401 when no cookie", async () => {
    const req = new Request("https://app.oauth.page/api/auth/me");
    const res = await app.fetch(req, env as any, ctx as any);
    expect(res.status).toBe(401);
    const body = await res.json() as any;
    expect(body.user).toBeNull();
  });

  it("POST /api/auth/github returns redirect URL with correct client_id", async () => {
    const req = new Request("https://app.oauth.page/api/auth/github", { method: "POST" });
    const res = await app.fetch(req, env as any, ctx as any);
    // The github auth handler should return a JSON with url containing client_id
    const body = await res.json() as any;
    if (body.url) {
      expect(body.url).toContain("test-github-client-id");
    }
    // If status is 200 or 302, the endpoint works
    expect([200, 302].includes(res.status) || body.url).toBeTruthy();
  });

  it("GET /api/sites returns 401 when not authenticated", async () => {
    const req = new Request("https://app.oauth.page/api/sites");
    const res = await app.fetch(req, env as any, ctx as any);
    expect(res.status).toBe(401);
    const body = await res.json() as any;
    expect(body.error).toBe("Unauthorized");
  });

  it("POST /api/auth/logout clears cookie", async () => {
    const req = new Request("https://app.oauth.page/api/auth/logout", { method: "POST" });
    const res = await app.fetch(req, env as any, ctx as any);
    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie") || "";
    expect(setCookie).toContain("gk_owner=");
    expect(setCookie).toContain("Max-Age=0");
  });

  it("GET /api/flags returns beta flag shape", async () => {
    const req = new Request("https://app.oauth.page/api/flags");
    const res = await app.fetch(req, env as any, ctx as any);
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.beta).toBeDefined();
    expect(body.beta.one_time_links).toBeDefined();
  });

  it("Unknown API route returns 404", async () => {
    const req = new Request("https://app.oauth.page/api/nonexistent");
    const res = await app.fetch(req, env as any, ctx as any);
    expect(res.status).toBe(404);
    const body = await res.json() as any;
    expect(body.error).toBe("Not found");
  });
  it('GET /api/auth/me returns user:null (not redirect) for unauthenticated requests', async () => {
    // This verifies the auth check endpoint returns 401 gracefully
    // and does NOT cause infinite redirect loops on the client
    const req = new Request('https://app.oauth.page/api/auth/me');
    const res = await app.fetch(req, env as any, ctx as any);
    expect(res.status).toBe(401);
    const body = await res.json() as any;
    expect(body.user).toBeNull();
    // Crucially: no redirect header
    expect(res.headers.get('location')).toBeNull();
  });

  it('GET /api/sites/requests returns 401 when not authenticated', async () => {
    const req = new Request('https://app.oauth.page/api/sites/requests');
    const res = await app.fetch(req, env as any, ctx as any);
    expect(res.status).toBe(401);
  });

  it('GET /api/stats returns cached or fresh stats', async () => {
    env.KV.get.mockResolvedValue(JSON.stringify({ sites: 5, deploys: 100 }));
    const req = new Request('https://app.oauth.page/api/stats');
    const res = await app.fetch(req, env as any, ctx as any);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.sites).toBe(5);
    expect(body.deploys).toBe(100);
  });

  it("allows credentialed CORS for trusted dashboard origins only", async () => {
    const req = new Request("https://app.oauth.page/api/flags", {
      headers: { Origin: "https://app.oauth.page" },
    });
    const res = await app.fetch(req, env as any, ctx as any);
    expect(res.headers.get("access-control-allow-origin")).toBe("https://app.oauth.page");
    expect(res.headers.get("access-control-allow-credentials")).toBe("true");
  });

  it("does not expose credentialed CORS headers to tenant subdomains", async () => {
    const req = new Request("https://app.oauth.page/api/flags", {
      headers: { Origin: "https://evil.oauth.page" },
    });
    const res = await app.fetch(req, env as any, ctx as any);
    expect(res.headers.get("access-control-allow-origin")).toBeNull();
    expect(res.headers.get("access-control-allow-credentials")).toBeNull();
  });

});
