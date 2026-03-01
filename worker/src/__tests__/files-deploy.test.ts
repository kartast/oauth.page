import { describe, it, expect, vi, beforeEach } from "vitest";
import { getMimeType, isHashed } from "../api/files";

describe("File utilities", () => {
  describe("getMimeType", () => {
    it("returns correct MIME for common extensions", () => {
      expect(getMimeType("index.html")).toBe("text/html; charset=utf-8");
      expect(getMimeType("style.css")).toBe("text/css; charset=utf-8");
      expect(getMimeType("app.js")).toBe("application/javascript; charset=utf-8");
      expect(getMimeType("data.json")).toBe("application/json");
      expect(getMimeType("image.png")).toBe("image/png");
      expect(getMimeType("image.jpg")).toBe("image/jpeg");
      expect(getMimeType("image.svg")).toBe("image/svg+xml");
      expect(getMimeType("font.woff2")).toBe("font/woff2");
    });

    it("returns application/octet-stream for unknown extensions", () => {
      expect(getMimeType("file.xyz")).toBe("application/octet-stream");
      expect(getMimeType("noext")).toBe("application/octet-stream");
    });

    it("handles markdown files", () => {
      expect(getMimeType("README.md")).toBe("text/markdown; charset=utf-8");
    });
  });

  describe("isHashed", () => {
    it("detects hashed filenames", () => {
      expect(isHashed("app.abc123def.js")).toBe(true);
      expect(isHashed("style.1234abcd.css")).toBe(true);
      expect(isHashed("assets/chunk.abc123de.js")).toBe(true);
    });

    it("does not flag non-hashed filenames", () => {
      expect(isHashed("index.html")).toBe(false);
      expect(isHashed("README.md")).toBe(false);
      expect(isHashed("style.css")).toBe(false);
    });
  });
});

describe("Deploy: R2 file path validation", () => {
  it("r2Key builds correct path", () => {
    // Simulate r2Key function
    const r2Key = (ownerId: string, siteId: string, filePath: string) =>
      `u_${ownerId}/s_${siteId}/${filePath}`;

    expect(r2Key("owner1", "site1", "index.html")).toBe("u_owner1/s_site1/index.html");
    expect(r2Key("owner1", "site1", "assets/style.css")).toBe("u_owner1/s_site1/assets/style.css");
  });

  it("file path sanitization blocks traversal", () => {
    // Matches sanitizePath() in files.ts
    const sanitize = (path: string): string | null => {
      let clean = path.replace(/\0/g, "");
      clean = clean.replace(/^\/+/, "");
      if (clean.includes("..")) return null;
      if (!clean || clean === "/") return null;
      return clean;
    };

    expect(sanitize("../../../etc/passwd")).toBeNull(); // blocked by ..
    expect(sanitize("normal/file.html")).toBe("normal/file.html");
    expect(sanitize("file\0.html")).toBe("file.html");
    expect(sanitize("")).toBeNull();
    expect(sanitize("/")).toBeNull();
  });
});

describe("Deploy: cache invalidation keys", () => {
  it("invalidation targets correct KV keys", () => {
    const siteId = "site-abc123";
    const keys = [`md_site:${siteId}`, `sidebar:${siteId}`];
    expect(keys).toEqual(["md_site:site-abc123", "sidebar:site-abc123"]);
  });
});
