import { describe, it, expect } from "vitest";
import { parseTtlToSeconds } from "../commands/link.js";

describe("link ttl parser", () => {
  it("parses minutes/hours/days", () => {
    expect(parseTtlToSeconds("30m")).toBe(1800);
    expect(parseTtlToSeconds("1h")).toBe(3600);
    expect(parseTtlToSeconds("2d")).toBe(172800);
  });

  it("parses bare seconds", () => {
    expect(parseTtlToSeconds("90")).toBe(90);
    expect(parseTtlToSeconds("45s")).toBe(45);
  });

  it("rejects invalid format", () => {
    expect(() => parseTtlToSeconds("1w")).toThrow();
    expect(() => parseTtlToSeconds("abc")).toThrow();
  });
});
