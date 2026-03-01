import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createOwnerToken,
  verifyOwnerToken,
  revokeOwnerToken,
  generateToken,
  createVisitorSession,
  revokeVisitorSession,
  revokeVisitorSessionsByEmail,
  setOwnerCookie,
  setVisitorCookie,
  setSessionCookie,
} from "../auth/session";

function mockEnv() {
  const kvStore = new Map<string, { value: string; ttl?: number }>();
  return {
    KV: {
      put: vi.fn(async (key: string, value: string, opts?: any) => {
        kvStore.set(key, { value, ttl: opts?.expirationTtl });
      }),
      get: vi.fn(async (key: string) => {
        return kvStore.get(key)?.value ?? null;
      }),
      delete: vi.fn(async (key: string) => {
        kvStore.delete(key);
      }),
    },
    DB: {
      prepare: vi.fn(() => ({
        bind: vi.fn(() => ({
          run: vi.fn(async () => ({ success: true })),
          first: vi.fn(async () => null),
          all: vi.fn(async () => ({ results: [] })),
        })),
      })),
    },
    _kvStore: kvStore,
  } as any;
}

describe("Owner Session (KV-backed)", () => {
  let env: ReturnType<typeof mockEnv>;

  beforeEach(() => {
    env = mockEnv();
  });

  it("generateToken returns 64-char hex string", () => {
    const token = generateToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it("generateToken is unique each call", () => {
    const a = generateToken();
    const b = generateToken();
    expect(a).not.toBe(b);
  });

  it("createOwnerToken stores session in KV", async () => {
    const token = await createOwnerToken(env, {
      id: "user-1",
      email: "test@example.com",
      name: "Test User",
    });

    expect(token).toMatch(/^[0-9a-f]{64}$/);
    expect(env.KV.put).toHaveBeenCalledWith(
      `owner:${token}`,
      expect.any(String),
      expect.objectContaining({ expirationTtl: 30 * 24 * 60 * 60 })
    );

    const stored = JSON.parse(env._kvStore.get(`owner:${token}`)!.value);
    expect(stored.user_id).toBe("user-1");
    expect(stored.email).toBe("test@example.com");
    expect(stored.name).toBe("Test User");
    expect(stored.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it("verifyOwnerToken returns session for valid token", async () => {
    const token = await createOwnerToken(env, {
      id: "user-1",
      email: "test@example.com",
      name: "Test User",
    });

    const session = await verifyOwnerToken(env, token);
    expect(session).not.toBeNull();
    expect(session!.user_id).toBe("user-1");
    expect(session!.email).toBe("test@example.com");
  });

  it("verifyOwnerToken returns null for unknown token", async () => {
    const session = await verifyOwnerToken(env, "nonexistent-token");
    expect(session).toBeNull();
  });

  it("verifyOwnerToken returns null for expired token", async () => {
    const token = generateToken();
    const expired = JSON.stringify({
      user_id: "user-1",
      email: "test@example.com",
      name: "Test",
      exp: Math.floor(Date.now() / 1000) - 100,
    });
    env._kvStore.set(`owner:${token}`, { value: expired });

    const session = await verifyOwnerToken(env, token);
    expect(session).toBeNull();
  });

  it("revokeOwnerToken deletes from KV", async () => {
    const token = await createOwnerToken(env, {
      id: "user-1",
      email: "test@example.com",
      name: "Test User",
    });

    await revokeOwnerToken(env, token);
    expect(env.KV.delete).toHaveBeenCalledWith(`owner:${token}`);

    const session = await verifyOwnerToken(env, token);
    expect(session).toBeNull();
  });

  it("verifyOwnerToken returns null for malformed JSON", async () => {
    const token = generateToken();
    env._kvStore.set(`owner:${token}`, { value: "not json" });

    const session = await verifyOwnerToken(env, token);
    expect(session).toBeNull();
  });
});

describe("Visitor Session", () => {
  let env: ReturnType<typeof mockEnv>;

  beforeEach(() => {
    env = mockEnv();
  });

  it("createVisitorSession stores in KV and D1", async () => {
    const { token, expires_at } = await createVisitorSession(env, "site-1", "visitor@test.com");

    expect(token).toMatch(/^[0-9a-f]{64}$/);
    expect(expires_at).toBeGreaterThan(Math.floor(Date.now() / 1000));

    // KV stored
    expect(env.KV.put).toHaveBeenCalledWith(
      `session:${token}`,
      expect.any(String),
      expect.objectContaining({ expirationTtl: 30 * 24 * 60 * 60 })
    );

    // D1 stored
    expect(env.DB.prepare).toHaveBeenCalled();
  });

  it("revokeVisitorSession deletes from KV and D1", async () => {
    await revokeVisitorSession(env, "test-token-123");
    expect(env.KV.delete).toHaveBeenCalledWith("session:test-token-123");
    expect(env.DB.prepare).toHaveBeenCalled();
  });
});

describe("Cookie formatting", () => {
  it("setOwnerCookie omits Domain for workers.dev", () => {
    const cookie = setOwnerCookie("tok123", 3600, "https://staging.karta.workers.dev");
    expect(cookie).not.toContain("Domain=");
    expect(cookie).toContain("gk_owner=tok123");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("SameSite=Lax");
  });

  it("setOwnerCookie includes Domain for oauth.page", () => {
    const cookie = setOwnerCookie("tok123", 3600, "https://app.oauth.page");
    expect(cookie).toContain("Domain=.oauth.page");
  });

  it("setVisitorCookie omits Domain for workers.dev", () => {
    const cookie = setVisitorCookie("vtok", "https://staging.karta.workers.dev");
    expect(cookie).not.toContain("Domain=");
    expect(cookie).toContain("gk_visitor=vtok");
  });

  it("setSessionCookie includes custom domain", () => {
    const cookie = setSessionCookie("stok", "test-site.oauth.page");
    expect(cookie).toContain("Domain=test-site.oauth.page");
    expect(cookie).toContain("gk_session=stok");
  });
});
