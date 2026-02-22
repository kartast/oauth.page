import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../auth.js", () => ({
  loadConfig: vi.fn(() => ({ token: "test-token" })),
}));

import { apiFetch, API_BASE } from "../api.js";
import { loadConfig } from "../auth.js";

describe("CLI apiFetch", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("exports expected API base", () => {
    expect(API_BASE).toBe("https://app.oauth.page");
  });

  it("sends bearer token header", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    await apiFetch("/api/sites");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, opts] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://app.oauth.page/api/sites");
    expect((opts.headers as Record<string, string>).Authorization).toBe("Bearer test-token");
  });

  it("throws login error when token missing", async () => {
    vi.mocked(loadConfig).mockReturnValueOnce({});
    await expect(apiFetch("/api/sites")).rejects.toThrow("Not logged in");
  });

  it("throws session expired on 401", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }))
    );
    await expect(apiFetch("/api/sites")).rejects.toThrow("Session expired");
  });

  it("uses API error body when present", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ error: "boom" }), { status: 400 }))
    );
    await expect(apiFetch("/api/sites")).rejects.toThrow("boom");
  });
});
