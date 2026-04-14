import { describe, it, expect } from "vitest";
import {
  sanitizeHtml,
  sanitizeText as sanitizeHtmlText,
  needsSanitization,
} from "@/lib/security/sanitize-html";

describe("sanitizeHtml", () => {
  it("should allow basic formatting tags", () => {
    expect(sanitizeHtml("<b>bold</b>")).toBe("<b>bold</b>");
    expect(sanitizeHtml("<i>italic</i>")).toBe("<i>italic</i>");
    expect(sanitizeHtml("<em>emphasis</em>")).toBe("<em>emphasis</em>");
    expect(sanitizeHtml("<strong>strong</strong>")).toBe("<strong>strong</strong>");
  });

  it("should allow span tags", () => {
    expect(sanitizeHtml("<span>text</span>")).toBe("<span>text</span>");
  });

  it("should strip script tags", () => {
    const result = sanitizeHtml("<script>alert('xss')</script>");
    expect(result).not.toContain("<script>");
    expect(result).not.toContain("</script>");
  });

  it("should strip dangerous tags", () => {
    expect(sanitizeHtml("<div onclick='evil'>text</div>")).not.toContain("onclick");
    expect(sanitizeHtml('<img src=x onerror="alert(1)">')).not.toContain("onerror");
  });

  it("should handle null input", () => {
    expect(sanitizeHtml(null)).toBe("");
  });

  it("should handle undefined input", () => {
    expect(sanitizeHtml(undefined)).toBe("");
  });

  it("should handle empty string", () => {
    expect(sanitizeHtml("")).toBe("");
  });

  it("should preserve plain text", () => {
    expect(sanitizeHtml("Hello World")).toBe("Hello World");
  });

  it("should strip all attributes from allowed tags", () => {
    const result = sanitizeHtml('<b class="evil">text</b>');
    expect(result).not.toContain("class");
  });
});

describe("sanitizeHtmlText (sanitizeText export)", () => {
  it("should strip all HTML tags", () => {
    expect(sanitizeHtmlText("<b>bold</b>")).toBe("bold");
    expect(sanitizeHtmlText("<div>text</div>")).toBe("text");
  });

  it("should preserve plain text", () => {
    expect(sanitizeHtmlText("Hello World")).toBe("Hello World");
  });

  it("should handle null input", () => {
    expect(sanitizeHtmlText(null)).toBe("");
  });

  it("should handle undefined input", () => {
    expect(sanitizeHtmlText(undefined)).toBe("");
  });
});

describe("needsSanitization", () => {
  it("should return true for non-empty strings", () => {
    expect(needsSanitization("hello")).toBe(true);
  });

  it("should return false for empty strings", () => {
    expect(needsSanitization("")).toBe(false);
  });

  it("should return false for null", () => {
    expect(needsSanitization(null)).toBe(false);
  });

  it("should return false for numbers", () => {
    expect(needsSanitization(42)).toBe(false);
  });

  it("should return false for undefined", () => {
    expect(needsSanitization(undefined)).toBe(false);
  });

  it("should return true for strings with HTML", () => {
    expect(needsSanitization("<script>alert(1)</script>")).toBe(true);
  });
});