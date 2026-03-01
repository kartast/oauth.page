import { describe, it, expect } from "vitest";
import {
  accessApprovedEmail,
  accessDeniedEmail,
  newAccessRequestEmail,
} from "../email";

describe("Email templates", () => {
  describe("accessApprovedEmail", () => {
    it("generates correct subject and HTML", () => {
      const email = accessApprovedEmail("Alice", "My Site", "https://my-site.oauth.page");
      expect(email.subject).toBe("You've been granted access to My Site");
      expect(email.html).toContain("Access Approved");
      expect(email.html).toContain("Alice");
      expect(email.html).toContain("My Site");
      expect(email.html).toContain("https://my-site.oauth.page");
    });

    it("escapes HTML in user names", () => {
      const email = accessApprovedEmail("<script>alert(1)</script>", "Test", "https://test.oauth.page");
      expect(email.html).not.toContain("<script>");
      expect(email.html).toContain("&lt;script&gt;");
    });
  });

  describe("accessDeniedEmail", () => {
    it("generates correct subject", () => {
      const email = accessDeniedEmail("Bob", "Private Site");
      expect(email.subject).toBe("Access request for Private Site was denied");
      expect(email.html).toContain("Access Denied");
      expect(email.html).toContain("Bob");
    });
  });

  describe("newAccessRequestEmail", () => {
    it("generates correct content with all params", () => {
      const email = newAccessRequestEmail(
        "Owner",
        "Visitor",
        "visitor@test.com",
        "My Site",
        "https://app.oauth.page/sites/123"
      );
      expect(email.subject).toBe("New access request for My Site");
      expect(email.html).toContain("Owner");
      expect(email.html).toContain("Visitor");
      expect(email.html).toContain("visitor@test.com");
      expect(email.html).toContain("Review Request");
    });

    it("escapes HTML in visitor email", () => {
      const email = newAccessRequestEmail(
        "Owner",
        "Hacker",
        '"><img src=x onerror=alert(1)>',
        "Site",
        "https://app.oauth.page"
      );
      expect(email.html).toContain("&lt;img");
      expect(email.html).toContain("&quot;");
    });
  });
});
