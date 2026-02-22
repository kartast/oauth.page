import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadConfig, saveConfig, clearConfig } from "../auth.js";

describe("CLI auth config", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "oauthpage-cli-test-"));
    process.env.OAUTHPAGE_CONFIG_DIR = dir;
  });

  afterEach(() => {
    delete process.env.OAUTHPAGE_CONFIG_DIR;
    rmSync(dir, { recursive: true, force: true });
  });

  it("returns empty object when config missing", () => {
    expect(loadConfig()).toEqual({});
  });

  it("saves and loads config", () => {
    saveConfig({ token: "abc", email: "a@b.com", name: "A" });
    expect(loadConfig()).toEqual({ token: "abc", email: "a@b.com", name: "A" });
  });

  it("clears config file", () => {
    saveConfig({ token: "abc" });
    const configFile = join(dir, "config.json");
    expect(existsSync(configFile)).toBe(true);
    clearConfig();
    expect(existsSync(configFile)).toBe(false);
  });

  it("writes pretty JSON with newline", () => {
    saveConfig({ token: "abc" });
    const raw = readFileSync(join(dir, "config.json"), "utf-8");
    expect(raw.endsWith("\n")).toBe(true);
    expect(raw).toContain('"token": "abc"');
  });
});
