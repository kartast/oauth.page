import { describe, it, expect } from "vitest";
import { renderGatePage } from "../gate";

describe("Gate page rendering", () => {
  it("renders sign-in buttons when no visitor", () => {
    const html = renderGatePage({ siteName: "Test Site", slug: "test-site" });
    expect(html).toContain("Sign in with GitHub");
    expect(html).toContain("Sign in with Google");
    expect(html).toContain("This site is private");
    expect(html).toContain("test-site");
  });

  it("escapes site name to prevent XSS", () => {
    const html = renderGatePage({
      siteName: '<script>alert("xss")</script>',
      slug: "test",
    });
    expect(html).not.toContain("<script>alert");
    expect(html).toContain("&lt;script&gt;");
  });

  it("escapes slug in OAuth URLs", () => {
    const html = renderGatePage({
      siteName: "Test",
      slug: '"><script>',
    });
    expect(html).not.toContain('"><script>');
    expect(html).toContain("&quot;&gt;&lt;script&gt;");
  });

  it("renders pending status for visitor with pending request", () => {
    const html = renderGatePage({
      siteName: "Test",
      slug: "test",
      visitor: { email: "test@test.com", name: "Tester", avatar_url: "", provider: "github" },
      requestStatus: "pending",
    });
    expect(html).toContain("Access Requested");
    expect(html).toContain("Waiting for the owner");
    expect(html).toContain("Tester");
  });

  it("renders denied status", () => {
    const html = renderGatePage({
      siteName: "Test",
      slug: "test",
      visitor: { email: "test@test.com", name: "Tester", avatar_url: "", provider: "github" },
      requestStatus: "denied",
    });
    expect(html).toContain("Access Denied");
  });

  it("renders request access button for visitor with no request", () => {
    const html = renderGatePage({
      siteName: "Test",
      slug: "test",
      visitor: { email: "test@test.com", name: "Tester", avatar_url: "https://avatar.url/pic.jpg", provider: "github" },
      requestStatus: "none",
    });
    expect(html).toContain("Request Access");
    expect(html).toContain("https://avatar.url/pic.jpg");
  });

  it("renders avatar placeholder when no avatar_url", () => {
    const html = renderGatePage({
      siteName: "Test",
      slug: "test",
      visitor: { email: "test@test.com", name: "Alice", avatar_url: "", provider: "github" },
      requestStatus: "none",
    });
    expect(html).toContain("avatar-placeholder");
    expect(html).toContain(">A</div>");
  });

  it("escapes visitor name and email", () => {
    const html = renderGatePage({
      siteName: "Test",
      slug: "test",
      visitor: {
        email: '<img onerror=alert(1)>',
        name: "<b>bold</b>",
        avatar_url: "",
        provider: "github",
      },
      requestStatus: "pending",
    });
    expect(html).not.toContain("<b>bold</b>");
    expect(html).toContain("&lt;b&gt;bold&lt;/b&gt;");
    expect(html).toContain("&lt;img");
  });
});
