import { describe, it, expect } from "vitest";
import { setOwnerCookie, setVisitorCookie, setSessionCookie } from "../auth/session";

describe("Cookie Formatters", () => {
  describe("setOwnerCookie", () => {
    it("has correct format with HttpOnly, Secure, SameSite, Domain, Path", () => {
      const cookie = setOwnerCookie("test-token-123");
      expect(cookie).toContain("gk_owner=test-token-123");
      expect(cookie).toContain("HttpOnly");
      expect(cookie).toContain("Secure");
      expect(cookie).toContain("SameSite=Lax");
      expect(cookie).toContain("Domain=.oauth.page");
      expect(cookie).toContain("Path=/");
    });

    it("includes Max-Age", () => {
      const cookie = setOwnerCookie("token", 3600);
      expect(cookie).toContain("Max-Age=3600");
    });

    it("uses default Max-Age of 30 days", () => {
      const cookie = setOwnerCookie("token");
      expect(cookie).toContain("Max-Age=2592000");
    });
  });

  describe("setVisitorCookie", () => {
    it("has correct format", () => {
      const cookie = setVisitorCookie("visitor-token-456");
      expect(cookie).toContain("gk_visitor=visitor-token-456");
      expect(cookie).toContain("HttpOnly");
      expect(cookie).toContain("Secure");
      expect(cookie).toContain("SameSite=Lax");
      expect(cookie).toContain("Domain=.oauth.page");
      expect(cookie).toContain("Path=/");
    });

    it("has 30 day Max-Age", () => {
      const cookie = setVisitorCookie("token");
      expect(cookie).toContain("Max-Age=2592000");
    });
  });

  describe("setSessionCookie", () => {
    it("has correct format with custom domain", () => {
      const cookie = setSessionCookie("session-token-789", "mysite.oauth.page");
      expect(cookie).toContain("gk_session=session-token-789");
      expect(cookie).toContain("Domain=mysite.oauth.page");
      expect(cookie).toContain("HttpOnly");
      expect(cookie).toContain("Secure");
      expect(cookie).toContain("SameSite=Lax");
      expect(cookie).toContain("Path=/");
    });

    it("supports custom Max-Age", () => {
      const cookie = setSessionCookie("token", "test.oauth.page", 7200);
      expect(cookie).toContain("Max-Age=7200");
    });
  });
});
