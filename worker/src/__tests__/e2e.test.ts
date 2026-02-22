import { describe, it, expect } from "vitest";

// E2E tests against live endpoints
// These tests require the worker to be deployed at oauth.page

describe("E2E: Live Endpoint Tests", () => {
  it("GET https://app.oauth.page/health returns 200", async () => {
    const res = await fetch("https://app.oauth.page/health");
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.status).toBe("ok");
  });

  it("GET https://app.oauth.page/ returns HTML with 'OAuthPage'", async () => {
    const res = await fetch("https://app.oauth.page/");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html.toLowerCase()).toContain("oauthpage");
  });

  it("GET https://app.oauth.page/api/auth/me returns 401", async () => {
    const res = await fetch("https://app.oauth.page/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("GET https://app.oauth.page/login returns 200 (SPA fallback)", async () => {
    const res = await fetch("https://app.oauth.page/login");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("</html>");
  });

  it("GET https://oauth.page/health returns 200", async () => {
    const res = await fetch("https://oauth.page/health");
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.status).toBe("ok");
  });

  it("GET https://nonexistent.oauth.page/ returns 'Site not found'", async () => {
    const res = await fetch("https://nonexistent-xyz-9999.oauth.page/");
    expect(res.status).toBe(404);
    const text = await res.text();
    expect(text).toContain("Site not found");
  });

  it("POST https://app.oauth.page/api/auth/github returns JSON with GitHub URL", async () => {
    const res = await fetch("https://app.oauth.page/api/auth/github", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const body = await res.json() as any;
    expect(body.url).toBeDefined();
    expect(body.url).toContain("github.com");
  });

  it("GET https://app.oauth.page/api/sites returns 401 when not authenticated", async () => {
    const res = await fetch("https://app.oauth.page/api/sites");
    expect(res.status).toBe(401);
  });
});
