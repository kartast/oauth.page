import { describe, it, expect, vi, beforeEach } from "vitest";
import app from "../index";
import { shouldResetMonthly, PLAN_LIMITS } from "../limits";

const JWT_SECRET = "test-jwt-secret-key-that-is-long-enough";

async function createTestJwt(
  userId: string = "owner1",
  email: string = "owner@example.com"
): Promise<string> {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const payload = btoa(
    JSON.stringify({
      sub: userId,
      email,
      name: "Owner",
      exp: Math.floor(Date.now() / 1000) + 3600,
    })
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const data = new TextEncoder().encode(`${header}.${payload}`);
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(JWT_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, data);
  const signature = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `${header}.${payload}.${signature}`;
}

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
      list: vi.fn(() =>
        Promise.resolve({ objects: [], truncated: false })
      ),
    },
    APP_URL: "https://app.oauth.page",
    GITHUB_CLIENT_ID: "test-github-client-id",
    GITHUB_CLIENT_SECRET: "test-github-secret",
    GOOGLE_CLIENT_ID: "test-google-client-id",
    GOOGLE_CLIENT_SECRET: "test-google-secret",
    JWT_SECRET,
    SCREENSHOT_QUEUE: { send: vi.fn(() => Promise.resolve()) },
    BETA_ONE_TIME_LINKS: "true",
  };
}

function createMockExecutionCtx() {
  return {
    waitUntil: vi.fn(),
    passThroughOnException: vi.fn(),
  };
}

describe("Plan Limits Config", () => {
  it("has correct free plan limits", () => {
    expect(PLAN_LIMITS.free.sites).toBe(3);
    expect(PLAN_LIMITS.free.storageMb).toBe(5);
    expect(PLAN_LIMITS.free.deploysPerMonth).toBe(10);
    expect(PLAN_LIMITS.free.viewsPerSite).toBe(1000);
    expect(PLAN_LIMITS.free.emailsPerMonth).toBe(5);
    expect(PLAN_LIMITS.free.oneTimeLinks).toBe(3);
    expect(PLAN_LIMITS.free.screenshotOnEveryDeploy).toBe(false);
  });

  it("has correct pro plan limits", () => {
    expect(PLAN_LIMITS.pro.sites).toBe(25);
    expect(PLAN_LIMITS.pro.storageMb).toBe(25);
    expect(PLAN_LIMITS.pro.deploysPerMonth).toBe(100);
    expect(PLAN_LIMITS.pro.viewsPerSite).toBe(50000);
    expect(PLAN_LIMITS.pro.emailsPerMonth).toBe(-1);
    expect(PLAN_LIMITS.pro.oneTimeLinks).toBe(-1);
    expect(PLAN_LIMITS.pro.screenshotOnEveryDeploy).toBe(true);
  });
});

describe("shouldResetMonthly", () => {
  it("returns true when resetAt is null", () => {
    expect(shouldResetMonthly(null)).toBe(true);
  });

  it("returns false when resetAt is in current month", () => {
    const now = Math.floor(Date.now() / 1000);
    expect(shouldResetMonthly(now)).toBe(false);
  });

  it("returns true when resetAt is in a previous month", () => {
    const pastDate = new Date();
    pastDate.setUTCMonth(pastDate.getUTCMonth() - 1);
    const resetAt = Math.floor(pastDate.getTime() / 1000);
    expect(shouldResetMonthly(resetAt)).toBe(true);
  });
});

describe("Limit Enforcement", () => {
  let env: ReturnType<typeof createMockEnv>;
  let ctx: ReturnType<typeof createMockExecutionCtx>;
  let token: string;

  beforeEach(async () => {
    env = createMockEnv();
    ctx = createMockExecutionCtx();
    token = await createTestJwt();
  });

  // --- 1. Site creation limit ---
  describe("Site creation limit", () => {
    it("returns 403 when free plan site limit reached", async () => {
      env.DB.prepare.mockImplementation((sql: string) => {
        // getLimits query
        if (sql.includes("plan, deploys_this_month")) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() =>
                Promise.resolve({
                  plan: "free",
                  deploys_this_month: 0,
                  deploys_reset_at: null,
                  emails_this_month: 0,
                })
              ),
            })),
          };
        }
        // COUNT sites
        if (sql.includes("COUNT(*)") && sql.includes("sites")) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() => Promise.resolve({ c: 3 })),
            })),
          };
        }
        return {
          bind: vi.fn(() => ({
            first: vi.fn(() => Promise.resolve(null)),
            all: vi.fn(() => Promise.resolve({ results: [] })),
            run: vi.fn(() => Promise.resolve()),
          })),
        };
      });

      const req = new Request("https://app.oauth.page/api/sites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `gk_owner=${token}`,
        },
        body: JSON.stringify({ name: "New Site" }),
      });
      const res = await app.fetch(req, env as any, ctx as any);
      expect(res.status).toBe(403);
      const body = (await res.json()) as any;
      expect(body.error).toBe("Limit reached");
      expect(body.limit).toBe("sites");
      expect(body.current).toBe(3);
      expect(body.max).toBe(3);
    });

    it("allows site creation for pro plan with higher limit", async () => {
      env.DB.prepare.mockImplementation((sql: string) => {
        if (sql.includes("plan, deploys_this_month")) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() =>
                Promise.resolve({
                  plan: "pro",
                  deploys_this_month: 0,
                  deploys_reset_at: null,
                  emails_this_month: 0,
                })
              ),
            })),
          };
        }
        if (sql.includes("COUNT(*)") && sql.includes("sites")) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() => Promise.resolve({ c: 3 })),
            })),
          };
        }
        if (sql.includes("SELECT id FROM sites WHERE slug")) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() => Promise.resolve(null)),
            })),
          };
        }
        if (sql.includes("INSERT INTO sites")) {
          return {
            bind: vi.fn(() => ({
              run: vi.fn(() => Promise.resolve()),
            })),
          };
        }
        return {
          bind: vi.fn(() => ({
            first: vi.fn(() => Promise.resolve(null)),
            all: vi.fn(() => Promise.resolve({ results: [] })),
            run: vi.fn(() => Promise.resolve()),
          })),
        };
      });

      const req = new Request("https://app.oauth.page/api/sites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `gk_owner=${token}`,
        },
        body: JSON.stringify({ name: "New Site" }),
      });
      const res = await app.fetch(req, env as any, ctx as any);
      expect(res.status).toBe(201);
    });
  });

  // --- 2. Storage limit ---
  describe("Storage limit (file upload)", () => {
    it("returns 403 when storage quota exceeded", async () => {
      const siteId = "site-1";
      env.DB.prepare.mockImplementation((sql: string) => {
        if (sql.includes("plan, deploys_this_month")) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() =>
                Promise.resolve({
                  plan: "free",
                  deploys_this_month: 0,
                  deploys_reset_at: Math.floor(Date.now() / 1000),
                  emails_this_month: 0,
                })
              ),
            })),
          };
        }
        if (sql.includes("SELECT * FROM sites WHERE id")) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() =>
                Promise.resolve({
                  id: siteId,
                  owner_id: "owner1",
                  slug: "test",
                  storage_bytes: 5 * 1024 * 1024, // already at 5MB
                })
              ),
            })),
          };
        }
        return {
          bind: vi.fn(() => ({
            first: vi.fn(() => Promise.resolve(null)),
            all: vi.fn(() => Promise.resolve({ results: [] })),
            run: vi.fn(() => Promise.resolve()),
          })),
        };
      });

      const req = new Request(
        `https://app.oauth.page/api/sites/${siteId}/files/test.html`,
        {
          method: "PUT",
          headers: { Cookie: `gk_owner=${token}` },
          body: new ArrayBuffer(100),
        }
      );
      const res = await app.fetch(req, env as any, ctx as any);
      expect(res.status).toBe(403);
      const body = (await res.json()) as any;
      expect(body.error).toBe("Limit reached");
      expect(body.limit).toBe("storageMb");
    });
  });

  // --- 3. Deploy limit ---
  describe("Deploy limit", () => {
    it("returns 403 when monthly deploy limit reached", async () => {
      const siteId = "site-1";
      env.DB.prepare.mockImplementation((sql: string) => {
        if (sql.includes("plan, deploys_this_month")) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() =>
                Promise.resolve({
                  plan: "free",
                  deploys_this_month: 10,
                  deploys_reset_at: Math.floor(Date.now() / 1000),
                  emails_this_month: 0,
                })
              ),
            })),
          };
        }
        if (sql.includes("SELECT * FROM sites WHERE id")) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() =>
                Promise.resolve({
                  id: siteId,
                  owner_id: "owner1",
                  slug: "test",
                  storage_bytes: 0,
                  thumbnail_status: null,
                  thumbnail_at: 0,
                })
              ),
            })),
          };
        }
        return {
          bind: vi.fn(() => ({
            first: vi.fn(() => Promise.resolve(null)),
            all: vi.fn(() => Promise.resolve({ results: [] })),
            run: vi.fn(() => Promise.resolve()),
          })),
        };
      });

      const req = new Request(
        `https://app.oauth.page/api/sites/${siteId}/deploy`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `gk_owner=${token}`,
          },
          body: JSON.stringify({
            files: [
              { path: "index.html", content_base64: btoa("<html></html>") },
            ],
          }),
        }
      );
      const res = await app.fetch(req, env as any, ctx as any);
      expect(res.status).toBe(403);
      const body = (await res.json()) as any;
      expect(body.error).toBe("Limit reached");
      expect(body.limit).toBe("deploysPerMonth");
      expect(body.current).toBe(10);
      expect(body.max).toBe(10);
    });

    it("resets deploy counter on new month (lazy reset)", async () => {
      const siteId = "site-1";
      const lastMonth = new Date();
      lastMonth.setUTCMonth(lastMonth.getUTCMonth() - 1);
      const lastMonthTs = Math.floor(lastMonth.getTime() / 1000);

      const runMock = vi.fn(() => Promise.resolve());

      env.DB.prepare.mockImplementation((sql: string) => {
        if (sql.includes("plan, deploys_this_month")) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() =>
                Promise.resolve({
                  plan: "free",
                  deploys_this_month: 10, // at limit but from last month
                  deploys_reset_at: lastMonthTs,
                  emails_this_month: 0,
                })
              ),
            })),
          };
        }
        if (sql.includes("SELECT * FROM sites WHERE id")) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() =>
                Promise.resolve({
                  id: siteId,
                  owner_id: "owner1",
                  slug: "test",
                  storage_bytes: 0,
                  thumbnail_status: null,
                  thumbnail_at: 0,
                })
              ),
            })),
          };
        }
        if (sql.includes("UPDATE users SET deploys_this_month = 0")) {
          return { bind: vi.fn(() => ({ run: runMock })) };
        }
        if (sql.includes("UPDATE users SET deploys_this_month = deploys_this_month + 1")) {
          return { bind: vi.fn(() => ({ run: vi.fn(() => Promise.resolve()) })) };
        }
        if (sql.includes("UPDATE sites SET storage_bytes")) {
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

      const req = new Request(
        `https://app.oauth.page/api/sites/${siteId}/deploy`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `gk_owner=${token}`,
          },
          body: JSON.stringify({
            files: [
              { path: "index.html", content_base64: btoa("<html></html>") },
            ],
          }),
        }
      );
      const res = await app.fetch(req, env as any, ctx as any);
      // Should succeed because counter was reset
      expect(res.status).toBe(200);
      // Verify reset was called
      expect(runMock).toHaveBeenCalled();
    });

    it("pro plan allows higher deploy limit", async () => {
      const siteId = "site-1";
      env.DB.prepare.mockImplementation((sql: string) => {
        if (sql.includes("plan, deploys_this_month")) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() =>
                Promise.resolve({
                  plan: "pro",
                  deploys_this_month: 10, // 10 deploys, pro allows 100
                  deploys_reset_at: Math.floor(Date.now() / 1000),
                  emails_this_month: 0,
                })
              ),
            })),
          };
        }
        if (sql.includes("SELECT * FROM sites WHERE id")) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() =>
                Promise.resolve({
                  id: siteId,
                  owner_id: "owner1",
                  slug: "test",
                  storage_bytes: 0,
                  thumbnail_status: "ready",
                  thumbnail_at: 0,
                })
              ),
            })),
          };
        }
        if (sql.includes("UPDATE users SET deploys_this_month = deploys_this_month + 1")) {
          return { bind: vi.fn(() => ({ run: vi.fn(() => Promise.resolve()) })) };
        }
        if (sql.includes("UPDATE sites SET storage_bytes")) {
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

      const req = new Request(
        `https://app.oauth.page/api/sites/${siteId}/deploy`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `gk_owner=${token}`,
          },
          body: JSON.stringify({
            files: [
              { path: "index.html", content_base64: btoa("<html></html>") },
            ],
          }),
        }
      );
      const res = await app.fetch(req, env as any, ctx as any);
      expect(res.status).toBe(200);
    });
  });

  // --- 4. Screenshot limit ---
  describe("Screenshot limit", () => {
    it("returns 403 for free plan when screenshot already taken", async () => {
      const siteId = "site-1";
      env.DB.prepare.mockImplementation((sql: string) => {
        if (sql.includes("plan, deploys_this_month")) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() =>
                Promise.resolve({
                  plan: "free",
                  deploys_this_month: 0,
                  deploys_reset_at: null,
                  emails_this_month: 0,
                })
              ),
            })),
          };
        }
        if (sql.includes("SELECT * FROM sites WHERE id")) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() =>
                Promise.resolve({
                  id: siteId,
                  owner_id: "owner1",
                  slug: "test",
                  thumbnail_status: "ready", // already taken
                  thumbnail_at: Math.floor(Date.now() / 1000),
                })
              ),
            })),
          };
        }
        return {
          bind: vi.fn(() => ({
            first: vi.fn(() => Promise.resolve(null)),
            all: vi.fn(() => Promise.resolve({ results: [] })),
            run: vi.fn(() => Promise.resolve()),
          })),
        };
      });

      const req = new Request(
        `https://app.oauth.page/api/sites/${siteId}/screenshot`,
        {
          method: "POST",
          headers: { Cookie: `gk_owner=${token}` },
        }
      );
      const res = await app.fetch(req, env as any, ctx as any);
      expect(res.status).toBe(403);
      const body = (await res.json()) as any;
      expect(body.error).toBe("Limit reached");
      expect(body.limit).toBe("screenshots");
    });

    it("allows screenshot for free plan when thumbnail_status is NULL (first time)", async () => {
      const siteId = "site-1";
      env.DB.prepare.mockImplementation((sql: string) => {
        if (sql.includes("plan, deploys_this_month")) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() =>
                Promise.resolve({
                  plan: "free",
                  deploys_this_month: 0,
                  deploys_reset_at: null,
                  emails_this_month: 0,
                })
              ),
            })),
          };
        }
        if (sql.includes("SELECT * FROM sites WHERE id")) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() =>
                Promise.resolve({
                  id: siteId,
                  owner_id: "owner1",
                  slug: "test",
                  thumbnail_status: null, // never taken
                  thumbnail_at: null,
                })
              ),
            })),
          };
        }
        if (sql.includes("UPDATE sites SET thumbnail_status")) {
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

      const req = new Request(
        `https://app.oauth.page/api/sites/${siteId}/screenshot`,
        {
          method: "POST",
          headers: { Cookie: `gk_owner=${token}` },
        }
      );
      const res = await app.fetch(req, env as any, ctx as any);
      expect(res.status).toBe(200);
      const body = (await res.json()) as any;
      expect(body.status).toBe("pending");
    });

    it("allows pro plan to retake screenshot", async () => {
      const siteId = "site-1";
      env.DB.prepare.mockImplementation((sql: string) => {
        if (sql.includes("plan, deploys_this_month")) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() =>
                Promise.resolve({
                  plan: "pro",
                  deploys_this_month: 0,
                  deploys_reset_at: null,
                  emails_this_month: 0,
                })
              ),
            })),
          };
        }
        if (sql.includes("SELECT * FROM sites WHERE id")) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() =>
                Promise.resolve({
                  id: siteId,
                  owner_id: "owner1",
                  slug: "test",
                  thumbnail_status: "ready",
                  thumbnail_at: Math.floor(Date.now() / 1000),
                })
              ),
            })),
          };
        }
        if (sql.includes("UPDATE sites SET thumbnail_status")) {
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

      const req = new Request(
        `https://app.oauth.page/api/sites/${siteId}/screenshot`,
        {
          method: "POST",
          headers: { Cookie: `gk_owner=${token}` },
        }
      );
      const res = await app.fetch(req, env as any, ctx as any);
      expect(res.status).toBe(200);
    });
  });

  // --- 5. Page view limit ---
  describe("Page view limit", () => {
    it("returns 429 when views exceeded", async () => {
      env.KV.get.mockImplementation(async (key: string) => {
        if (key === "site:test-site") {
          return JSON.stringify({
            id: "site1",
            slug: "test-site",
            name: "Test",
            owner_id: "owner1",
          });
        }
        if (key === "session:sess-tok") {
          return JSON.stringify({
            id: "s1",
            email: "visitor@example.com",
            site_id: "site1",
            expires_at: Math.floor(Date.now() / 1000) + 3600,
          });
        }
        return null;
      });

      env.DB.prepare.mockImplementation((sql: string) => {
        if (sql.includes("SELECT plan FROM users")) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() => Promise.resolve({ plan: "free" })),
            })),
          };
        }
        if (sql.includes("views_this_month, views_reset_at")) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() =>
                Promise.resolve({
                  views_this_month: 1000,
                  views_reset_at: Math.floor(Date.now() / 1000),
                })
              ),
            })),
          };
        }
        return {
          bind: vi.fn(() => ({
            first: vi.fn(() => Promise.resolve(null)),
            all: vi.fn(() => Promise.resolve({ results: [] })),
            run: vi.fn(() => Promise.resolve()),
          })),
        };
      });

      const req = new Request("https://test-site.oauth.page/", {
        headers: { cookie: "gk_session=sess-tok" },
      });
      const res = await app.fetch(req, env as any, ctx as any);
      expect(res.status).toBe(429);
      const text = await res.text();
      expect(text).toContain("exceeded");
    });

    it("serves content when views under limit", async () => {
      env.KV.get.mockImplementation(async (key: string) => {
        if (key === "site:test-site") {
          return JSON.stringify({
            id: "site1",
            slug: "test-site",
            name: "Test",
            owner_id: "owner1",
          });
        }
        if (key === "session:sess-tok") {
          return JSON.stringify({
            id: "s1",
            email: "visitor@example.com",
            site_id: "site1",
            expires_at: Math.floor(Date.now() / 1000) + 3600,
          });
        }
        if (key === "views:site1") {
          return "5";
        }
        return null;
      });

      env.DB.prepare.mockImplementation((sql: string) => {
        if (sql.includes("SELECT plan FROM users")) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() => Promise.resolve({ plan: "free" })),
            })),
          };
        }
        if (sql.includes("views_this_month, views_reset_at")) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() =>
                Promise.resolve({
                  views_this_month: 500,
                  views_reset_at: Math.floor(Date.now() / 1000),
                })
              ),
            })),
          };
        }
        if (sql.includes("UPDATE sites SET total_requests")) {
          return {
            bind: vi.fn(() => ({
              run: vi.fn(() => Promise.resolve()),
            })),
          };
        }
        return {
          bind: vi.fn(() => ({
            first: vi.fn(() => Promise.resolve(null)),
            all: vi.fn(() => Promise.resolve({ results: [] })),
            run: vi.fn(() => Promise.resolve()),
          })),
        };
      });

      env.STORAGE.get.mockResolvedValue({
        body: "<html>hello</html>",
        httpEtag: '"etag1"',
      });

      const req = new Request("https://test-site.oauth.page/", {
        headers: { cookie: "gk_session=sess-tok" },
      });
      const res = await app.fetch(req, env as any, ctx as any);
      expect(res.status).toBe(200);
    });

    it("batches view writes using KV counter (flushes every 10)", async () => {
      env.KV.get.mockImplementation(async (key: string) => {
        if (key === "site:test-site") {
          return JSON.stringify({
            id: "site1",
            slug: "test-site",
            name: "Test",
            owner_id: "owner1",
          });
        }
        if (key === "session:sess-tok") {
          return JSON.stringify({
            id: "s1",
            email: "visitor@example.com",
            site_id: "site1",
            expires_at: Math.floor(Date.now() / 1000) + 3600,
          });
        }
        if (key === "views:site1") {
          return "9"; // next view will be 10th, triggering flush
        }
        return null;
      });

      const dbRunMock = vi.fn(() => Promise.resolve());
      env.DB.prepare.mockImplementation((sql: string) => {
        if (sql.includes("SELECT plan FROM users")) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() => Promise.resolve({ plan: "free" })),
            })),
          };
        }
        if (sql.includes("views_this_month, views_reset_at")) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() =>
                Promise.resolve({
                  views_this_month: 500,
                  views_reset_at: Math.floor(Date.now() / 1000),
                })
              ),
            })),
          };
        }
        if (sql.includes("UPDATE sites SET views_this_month = views_this_month +")) {
          return { bind: vi.fn(() => ({ run: dbRunMock })) };
        }
        if (sql.includes("UPDATE sites SET total_requests")) {
          return {
            bind: vi.fn(() => ({
              run: vi.fn(() => Promise.resolve()),
            })),
          };
        }
        return {
          bind: vi.fn(() => ({
            first: vi.fn(() => Promise.resolve(null)),
            all: vi.fn(() => Promise.resolve({ results: [] })),
            run: vi.fn(() => Promise.resolve()),
          })),
        };
      });

      env.STORAGE.get.mockResolvedValue({
        body: "<html>hello</html>",
        httpEtag: '"etag1"',
      });

      const req = new Request("https://test-site.oauth.page/", {
        headers: { cookie: "gk_session=sess-tok" },
      });
      const res = await app.fetch(req, env as any, ctx as any);
      expect(res.status).toBe(200);

      // DB should have been updated with batch of 10 views
      expect(dbRunMock).toHaveBeenCalled();
      // KV counter should have been deleted (flushed)
      const deleteCalls = env.KV.delete.mock.calls.filter(
        (c: any[]) => c[0] === "views:site1"
      );
      expect(deleteCalls.length).toBe(1);
    });
  });

  // --- 6. Email limit ---
  describe("Email limit", () => {
    // Note: emails are sent fire-and-forget via waitUntil, so we test the
    // checkAndIncrementEmailLimit logic indirectly. When the limit is exceeded,
    // the email should be silently skipped (no error returned to user).
    // We verify this via the DB mock calls.

    it("silently skips email when limit reached (approve flow)", async () => {
      const siteId = "site-1";
      const requestId = "req-1";
      const emailRunMock = vi.fn(() => Promise.resolve());

      env.DB.prepare.mockImplementation((sql: string) => {
        if (sql.includes("plan, deploys_this_month")) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() =>
                Promise.resolve({
                  plan: "free",
                  deploys_this_month: 0,
                  deploys_reset_at: Math.floor(Date.now() / 1000),
                  emails_this_month: 5, // at limit
                })
              ),
            })),
          };
        }
        if (sql.includes("SELECT * FROM sites WHERE id") && sql.includes("owner_id")) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() =>
                Promise.resolve({
                  id: siteId,
                  owner_id: "owner1",
                  slug: "test",
                  name: "Test Site",
                })
              ),
            })),
          };
        }
        if (sql.includes("SELECT * FROM access_requests WHERE id")) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() =>
                Promise.resolve({
                  id: requestId,
                  site_id: siteId,
                  email: "visitor@example.com",
                  name: "Visitor",
                  status: "pending",
                })
              ),
            })),
          };
        }
        if (sql.includes("UPDATE access_requests SET status = 'approved'")) {
          return {
            bind: vi.fn(() => ({
              run: vi.fn(() => Promise.resolve()),
            })),
          };
        }
        if (sql.includes("INSERT INTO sessions")) {
          return {
            bind: vi.fn(() => ({
              run: vi.fn(() => Promise.resolve()),
            })),
          };
        }
        if (sql.includes("UPDATE users SET emails_this_month = emails_this_month + 1")) {
          return { bind: vi.fn(() => ({ run: emailRunMock })) };
        }
        return {
          bind: vi.fn(() => ({
            first: vi.fn(() => Promise.resolve(null)),
            all: vi.fn(() => Promise.resolve({ results: [] })),
            run: vi.fn(() => Promise.resolve()),
          })),
        };
      });

      const req = new Request(
        `https://app.oauth.page/api/sites/${siteId}/requests/${requestId}/approve`,
        {
          method: "POST",
          headers: { Cookie: `gk_owner=${token}` },
        }
      );
      const res = await app.fetch(req, env as any, ctx as any);
      expect(res.status).toBe(200);
      const body = (await res.json()) as any;
      expect(body.ok).toBe(true);

      // Execute all waitUntil callbacks
      for (const call of ctx.waitUntil.mock.calls) {
        await call[0];
      }

      // Email increment should NOT have been called (limit reached)
      expect(emailRunMock).not.toHaveBeenCalled();
    });
  });

  // --- 7. One-time link limit ---
  describe("One-time link limit", () => {
    it("returns 403 when active link limit reached", async () => {
      const siteId = "site-1";
      env.DB.prepare.mockImplementation((sql: string) => {
        if (sql.includes("plan, deploys_this_month")) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() =>
                Promise.resolve({
                  plan: "free",
                  deploys_this_month: 0,
                  deploys_reset_at: null,
                  emails_this_month: 0,
                })
              ),
            })),
          };
        }
        if (sql.includes("SELECT id, slug, owner_id FROM sites")) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() =>
                Promise.resolve({
                  id: siteId,
                  slug: "test",
                  owner_id: "owner1",
                })
              ),
            })),
          };
        }
        if (sql.includes("COUNT(*)") && sql.includes("one_time_links")) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() => Promise.resolve({ c: 3 })),
            })),
          };
        }
        return {
          bind: vi.fn(() => ({
            first: vi.fn(() => Promise.resolve(null)),
            all: vi.fn(() => Promise.resolve({ results: [] })),
            run: vi.fn(() => Promise.resolve()),
          })),
        };
      });

      const req = new Request(
        `https://app.oauth.page/api/sites/${siteId}/links`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `gk_owner=${token}`,
          },
          body: JSON.stringify({}),
        }
      );
      const res = await app.fetch(req, env as any, ctx as any);
      expect(res.status).toBe(403);
      const body = (await res.json()) as any;
      expect(body.error).toBe("Limit reached");
      expect(body.limit).toBe("oneTimeLinks");
      expect(body.current).toBe(3);
      expect(body.max).toBe(3);
    });

    it("allows link creation for pro plan (unlimited)", async () => {
      const siteId = "site-1";
      env.DB.prepare.mockImplementation((sql: string) => {
        if (sql.includes("plan, deploys_this_month")) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() =>
                Promise.resolve({
                  plan: "pro",
                  deploys_this_month: 0,
                  deploys_reset_at: null,
                  emails_this_month: 0,
                })
              ),
            })),
          };
        }
        if (sql.includes("SELECT id, slug, owner_id FROM sites")) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() =>
                Promise.resolve({
                  id: siteId,
                  slug: "test",
                  owner_id: "owner1",
                })
              ),
            })),
          };
        }
        if (sql.includes("INSERT INTO one_time_links")) {
          return {
            bind: vi.fn(() => ({
              run: vi.fn(() => Promise.resolve()),
            })),
          };
        }
        return {
          bind: vi.fn(() => ({
            first: vi.fn(() => Promise.resolve(null)),
            all: vi.fn(() => Promise.resolve({ results: [] })),
            run: vi.fn(() => Promise.resolve()),
          })),
        };
      });

      const req = new Request(
        `https://app.oauth.page/api/sites/${siteId}/links`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `gk_owner=${token}`,
          },
          body: JSON.stringify({}),
        }
      );
      const res = await app.fetch(req, env as any, ctx as any);
      expect(res.status).toBe(201);
      const body = (await res.json()) as any;
      expect(body.link).toBeDefined();
    });
  });
});
