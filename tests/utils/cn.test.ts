import { describe, it, expect, vi, beforeEach } from "vitest";
import { cn } from "@/lib/utils/cn";

describe("cn utility", () => {
  it("should merge class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("should handle conditional classes", () => {
    expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
  });

  it("should handle undefined values", () => {
    expect(cn("foo", undefined, "bar")).toBe("foo bar");
  });

  it("should handle null values", () => {
    expect(cn("foo", null, "bar")).toBe("foo bar");
  });

  it("should handle empty strings", () => {
    expect(cn("foo", "", "bar")).toBe("foo bar");
  });

  it("should handle tailwind merge conflicts", () => {
    // tailwind-merge should resolve conflicting classes
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("should handle non-conflicting tailwind classes", () => {
    expect(cn("px-2", "py-2")).toBe("px-2 py-2");
  });

  it("should handle arrays of classes", () => {
    expect(cn(["foo", "bar"], "baz")).toBe("foo bar baz");
  });

  it("should handle object notation", () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe("foo baz");
  });
});