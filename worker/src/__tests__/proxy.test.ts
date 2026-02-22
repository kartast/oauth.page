import { describe, it, expect, vi, beforeEach } from "vitest";
import app from "../index";
import { parseCookie } from "../proxy";

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
    STORAGE: {
      get: vi.fn(() => Promise.resolve(null)),
      put: vi.fn(() => Promise.resolve()),
      delete: vi.fn(() => Promise.resolve()),
      list: vi.fn(() => Promise.resolve({ objects: [], truncated: false })),
    },
    APP_URL: "https://app.oauth.page",
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

describe("Proxy Logic", () => {
  let env: ReturnType<typeof createMockEnv>;
  let ctx: ReturnType<typeof createMockExecutionCtx>;

  beforeEach(() => {
    env = createMockEnv();
    ctx = createMockExecutionCtx();
  });

  it("Unknown subdomain returns 'Site not found'", async () => {
    // KV returns null for unknown slug
    env.KV.get.mockResolvedValue(null);

    const req = new Request("https://unknown-site.oauth.page/");
    const res = await app.fetch(req, env as any, ctx as any);
    expect(res.status).toBe(404);
    const text = await res.text();
    expect(text).toContain("Site not found");
  });

  it("'app' subdomain is not proxied (serves dashboard)", async () => {
    const req = new Request("https://app.oauth.page/health");
    const res = await app.fetch(req, env as any, ctx as any);
    // app subdomain serves API/dashboard, not proxy
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.status).toBe("ok");
  });

  it("Root domain redirects to app or serves dashboard", async () => {
    // Root domain (oauth.page, no subdomain — 2 parts)
    env.KV.get.mockResolvedValue(null);
    const req = new Request("https://oauth.page/health");
    const res = await app.fetch(req, env as any, ctx as any);
    // Root domain serves dashboard/API same as app
    expect(res.status).toBe(200);
  });

  it("Owner email via visitor OAuth cookie is auto-allowed", async () => {
    const now = Math.floor(Date.now() / 1000) + 3600;

    // site lookup + visitor lookup
    env.KV.get.mockImplementation(async (key: string) => {
      if (key === "site:game-mockups") {
        return JSON.stringify({ id: "site1", slug: "game-mockups", name: "Game Mockups", owner_id: "owner1" });
      }
      if (key === "visitor:vtok") {
        return JSON.stringify({ email: "owner@example.com", name: "Owner", provider: "github", avatar_url: "" });
      }
      return null;
    });

    // DB query branching by SQL text
    env.DB.prepare.mockImplementation((sql: string) => {
      if (sql.includes("SELECT u.id FROM users u JOIN sites s")) {
        return { bind: vi.fn(() => ({ first: vi.fn(() => Promise.resolve({ id: "owner1" })) })) };
      }
      if (sql.includes("UPDATE sites SET total_requests")) {
        return { bind: vi.fn(() => ({ run: vi.fn(() => Promise.resolve()) })) };
      }
      return {
        bind: vi.fn(() => ({
          first: vi.fn(() => Promise.resolve(null)),
          all: vi.fn(() => Promise.resolve({ results: [] })),
          run: vi.fn(() => Promise.resolve()),
        })),
      };
    });

    env.STORAGE.get.mockImplementation(async (key: string) => {
      if (key === "u_owner1/s_site1/index.html") {
        return { body: "<html><body>owner page</body></html>", httpEtag: `\"etag-${now}\"` };
      }
      return null;
    });

    const req = new Request("https://game-mockups.oauth.page/", {
      headers: { cookie: "gk_visitor=vtok" },
    });
    const res = await app.fetch(req, env as any, ctx as any);
    const text = await res.text();

    expect(res.status).toBe(200);
    expect(text).toContain("owner page");
  });
});

describe("parseCookie", () => {
  it("extracts correct cookie value", () => {
    const header = "gk_owner=abc123; gk_session=xyz789; other=val";
    expect(parseCookie(header, "gk_owner")).toBe("abc123");
    expect(parseCookie(header, "gk_session")).toBe("xyz789");
    expect(parseCookie(header, "other")).toBe("val");
  });

  it("returns null for missing cookie", () => {
    const header = "gk_owner=abc123";
    expect(parseCookie(header, "gk_session")).toBeNull();
  });

  it("handles empty cookie header", () => {
    expect(parseCookie("", "gk_owner")).toBeNull();
  });

  it("handles URL-encoded values", () => {
    const header = "gk_owner=hello%20world";
    expect(parseCookie(header, "gk_owner")).toBe("hello world");
  });
});
