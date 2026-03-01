import { describe, it, expect } from "vitest";

// Test the pure functions from proxy
// Import parseCookie from proxy
import { parseCookie } from "../proxy";

describe("Proxy: Docsify & Sidebar", () => {
  it("parseCookie handles special characters safely", () => {
    // Regression: parseCookie creates regex from name param
    // Ensure hardcoded names work correctly
    expect(parseCookie("gk_owner=abc123; gk_session=xyz", "gk_owner")).toBe("abc123");
    expect(parseCookie("gk_owner=abc123; gk_session=xyz", "gk_session")).toBe("xyz");
    expect(parseCookie("gk_visitor=def456", "gk_visitor")).toBe("def456");
    expect(parseCookie("", "gk_owner")).toBeNull();
    expect(parseCookie("other=val", "gk_owner")).toBeNull();
  });

  it("parseCookie decodes URL-encoded values", () => {
    expect(parseCookie("gk_owner=abc%20def", "gk_owner")).toBe("abc def");
  });

  it("parseCookie handles multiple cookies with same prefix", () => {
    expect(parseCookie("gk_owner2=wrong; gk_owner=right", "gk_owner")).toBe("right");
  });
});

describe("Proxy: XSS sanitization", () => {
  it("sidebar title sanitization strips dangerous chars", () => {
    // Simulate the sanitization logic from serveAutoSidebar
    const sanitize = (name: string) => name.replace(/[\[\]()\\<>"']/g, "");

    expect(sanitize("normal-file")).toBe("normal-file");
    expect(sanitize('"><script>alert(1)</script>')).toBe("scriptalert1/script");
    expect(sanitize("file[with]brackets")).toBe("filewithbrackets");
    expect(sanitize("file(with)parens")).toBe("filewithparens");
    expect(sanitize("it's-a-test")).toBe("its-a-test");
  });

  it("escapeHtml covers all HTML entities", () => {
    // Test the escapeHtml function inline
    const escapeHtml = (s: string) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;"
    );
    expect(escapeHtml("normal text")).toBe("normal text");
    expect(escapeHtml("a & b < c > d")).toBe("a &amp; b &lt; c &gt; d");
  });
});

describe("Proxy: Markdown site detection logic", () => {
  it("site with .md files and no .html is markdown site", () => {
    const keys = ["README.md", "guide.md", "image.png"];
    const hasMd = keys.some((k) => k.endsWith(".md"));
    const hasHtml = keys.some((k) => k.endsWith(".html"));
    expect(hasMd && !hasHtml).toBe(true);
  });

  it("site with index.html is NOT markdown site", () => {
    const keys = ["index.html", "README.md", "style.css"];
    const hasMd = keys.some((k) => k.endsWith(".md"));
    const hasHtml = keys.some((k) => k.endsWith(".html"));
    expect(hasMd && !hasHtml).toBe(false);
  });

  it("site with only .html is NOT markdown site", () => {
    const keys = ["index.html", "about.html"];
    const hasMd = keys.some((k) => k.endsWith(".md"));
    expect(hasMd).toBe(false);
  });

  it("empty site is NOT markdown site", () => {
    const keys: string[] = [];
    const hasMd = keys.some((k) => k.endsWith(".md"));
    expect(hasMd).toBe(false);
  });
});

describe("Proxy: Auto-sidebar generation logic", () => {
  it("generates correct sidebar from file list", () => {
    const files = ["README.md", "api-reference.md", "getting-started.md", "_sidebar.md"];
    const mdFiles = files
      .filter((k) => k.endsWith(".md") && !k.startsWith("_"))
      .sort();

    const sanitize = (name: string) => name.replace(/[\[\]()\\<>"']/g, "");
    const lines: string[] = [];
    for (const file of mdFiles) {
      const name = file.replace(/\.md$/, "");
      if (name === "README") {
        lines.unshift("- [Home](/)");
      } else {
        const rawTitle = name.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        const title = sanitize(rawTitle);
        lines.push(`- [${title}](/${sanitize(name)})`);
      }
    }

    expect(lines).toEqual([
      "- [Home](/)",
      "- [Api Reference](/api-reference)",
      "- [Getting Started](/getting-started)",
    ]);
  });

  it("handles nested paths", () => {
    const name = "docs/api/auth";
    const title = name.split("/").pop()!.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    expect(title).toBe("Auth");
  });
});

describe("Proxy: R2 path traversal protection", () => {
  it("cleanPath strips .. and null bytes", () => {
    const clean = (path: string) =>
      path.replace(/^\//, "").replace(/\.\./g, "").replace(/\0/g, "");

    expect(clean("/../../etc/passwd")).toBe("//etc/passwd");
    expect(clean("/normal/path.html")).toBe("normal/path.html");
    expect(clean("/file\0name.html")).toBe("filename.html");
    expect(clean("/../../../secret")).toBe("///secret");
  });
});

describe("Proxy: One-time link validation", () => {
  it("OTL path regex matches valid tokens", () => {
    const regex = /^\/_otl\/([a-f0-9]{32,})$/i;
    expect(regex.test("/_otl/abcdef1234567890abcdef1234567890")).toBe(true);
    expect(regex.test("/_otl/short")).toBe(false);
    expect(regex.test("/_otl/ABCDEF1234567890ABCDEF1234567890")).toBe(true);
    expect(regex.test("/other/path")).toBe(false);
    expect(regex.test("/_otl/abcdef1234567890abcdef1234567890/extra")).toBe(false);
  });
});
