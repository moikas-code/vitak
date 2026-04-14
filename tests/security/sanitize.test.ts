import { describe, it, expect } from "vitest";
import {
  sanitizeInput,
  sanitizeEmail,
  sanitizeUsername,
  sanitizeText,
  sanitizeUrl,
  sanitizeObject,
} from "@/lib/security/sanitize";

describe("sanitizeInput", () => {
  it("should escape HTML tags by removing < and >", () => {
    const result = sanitizeInput("<script>alert('xss')</script>");
    expect(result).not.toContain("<script>");
    expect(result).not.toContain("</script>");
  });

  it("should escape angle brackets", () => {
    const result = sanitizeInput("1 < 2 > 0");
    expect(result).not.toContain("<");
    expect(result).not.toContain(">");
  });

  it("should escape quotes", () => {
    const result = sanitizeInput('hello "world"');
    expect(result).not.toContain('"');
  });

  it("should escape single quotes", () => {
    const result = sanitizeInput("it's");
    expect(result).not.toContain("'");
  });

  it("should escape ampersands", () => {
    expect(sanitizeInput("a & b")).toContain("&amp;");
  });

  it("should remove null bytes", () => {
    expect(sanitizeInput("hello\0world")).toBe("helloworld");
  });

  it("should trim whitespace", () => {
    expect(sanitizeInput("  hello  ")).toBe("hello");
  });

  it("should truncate strings longer than 1000 chars", () => {
    const long = "a".repeat(1001);
    const result = sanitizeInput(long);
    expect(result.length).toBeLessThanOrEqual(1000);
  });

  it("should return empty string for null input", () => {
    expect(sanitizeInput(null as unknown as string)).toBe("");
  });

  it("should return empty string for undefined input", () => {
    expect(sanitizeInput(undefined as unknown as string)).toBe("");
  });

  it("should return empty string for non-string input", () => {
    expect(sanitizeInput(123 as unknown as string)).toBe("");
  });

  it("should handle empty string", () => {
    expect(sanitizeInput("")).toBe("");
  });

  it("should handle plain text without special chars", () => {
    expect(sanitizeInput("hello world")).toBe("hello world");
  });

  it("should handle mixed attack vectors", () => {
    const attack = '<img src=x onerror="alert(1)">';
    const result = sanitizeInput(attack);
    expect(result).not.toContain("<");
    expect(result).not.toContain(">");
  });
});

describe("sanitizeEmail", () => {
  it("should normalize email to lowercase", () => {
    expect(sanitizeEmail("User@Example.COM")).toBe("user@example.com");
  });

  it("should trim whitespace", () => {
    expect(sanitizeEmail("  user@example.com  ")).toBe("user@example.com");
  });

  it("should return empty string for invalid emails", () => {
    expect(sanitizeEmail("not-an-email")).toBe("");
  });

  it("should return empty string for null", () => {
    expect(sanitizeEmail(null as unknown as string)).toBe("");
  });

  it("should accept valid emails", () => {
    expect(sanitizeEmail("user@example.com")).toBe("user@example.com");
    expect(sanitizeEmail("a.b+c@s.io")).toBe("a.b+c@s.io");
  });

  it("should reject emails without @", () => {
    expect(sanitizeEmail("userexample.com")).toBe("");
  });

  it("should reject emails without domain", () => {
    expect(sanitizeEmail("user@")).toBe("");
  });

  it("should handle long emails - filter by length check", () => {
    // 250 + "@x.yyy" = 256 chars, over RFC 5321 limit of 254
    const long = "a".repeat(250) + "@x.yyy";
    const result = sanitizeEmail(long);
    // Either empty or truncated
    expect(result.length).toBeLessThanOrEqual(254);
  });
});

describe("sanitizeUsername", () => {
  it("should allow alphanumeric, underscore, hyphen", () => {
    expect(sanitizeUsername("user_name-123")).toBe("user_name-123");
  });

  it("should remove special characters", () => {
    expect(sanitizeUsername("user@name!")).toBe("username");
  });

  it("should truncate to 50 chars", () => {
    const long = "a".repeat(60);
    expect(sanitizeUsername(long).length).toBe(50);
  });

  it("should return empty string for null input", () => {
    expect(sanitizeUsername(null as unknown as string)).toBe("");
  });

  it("should handle empty string", () => {
    expect(sanitizeUsername("")).toBe("");
  });
});

describe("sanitizeText", () => {
  it("should remove null bytes", () => {
    expect(sanitizeText("hello\0world")).toBe("helloworld");
  });

  it("should remove control characters", () => {
    expect(sanitizeText("hello\x07world")).toBe("helloworld");
  });

  it("should preserve newlines and tabs", () => {
    expect(sanitizeText("hello\nworld\ttab")).toBe("hello\nworld\ttab");
  });

  it("should trim whitespace", () => {
    expect(sanitizeText("  hello  ")).toBe("hello");
  });

  it("should truncate to 500 chars", () => {
    const long = "a".repeat(501);
    const result = sanitizeText(long);
    expect(result.length).toBe(500);
  });

  it("should return empty string for null input", () => {
    expect(sanitizeText(null as unknown as string)).toBe("");
  });
});

describe("sanitizeUrl", () => {
  it("should accept http URLs", () => {
    const result = sanitizeUrl("http://example.com");
    expect(result).toBeTruthy();
  });

  it("should accept https URLs", () => {
    const result = sanitizeUrl("https://example.com");
    expect(result).toBeTruthy();
  });

  it("should reject javascript: URLs", () => {
    expect(sanitizeUrl("javascript:alert(1)")).toBe("");
  });

  it("should reject data: URLs", () => {
    expect(sanitizeUrl("data:text/html,<script>alert(1)</script>")).toBe("");
  });

  it("should return empty string for invalid URLs", () => {
    expect(sanitizeUrl("not-a-url")).toBe("");
  });

  it("should return empty string for null input", () => {
    expect(sanitizeUrl(null as unknown as string)).toBe("");
  });
});

describe("sanitizeObject", () => {
  it("should sanitize all fields according to their config", () => {
    const obj = {
      name: '<script>alert("xss")</script>',
      email: "  USER@EXAMPLE.COM  ",
      website: "https://example.com",
      username: "valid_user-123",
      bio: "Hello\x00World",
    };

    const result = sanitizeObject(obj, {
      name: "input",
      email: "email",
      website: "url",
      username: "username",
      bio: "text",
    });

    // All fields should be sanitized (not contain raw dangerous chars)
    expect(typeof result.name).toBe("string");
    expect(result.email).toBe("user@example.com");
    expect(result.username).toBe("valid_user-123");
    expect(result.bio).toBe("HelloWorld");
  });

  it("should skip non-string fields", () => {
    const obj = { count: 42, name: "test" };
    const result = sanitizeObject(obj, { count: "input" as const, name: "input" as const });
    expect(result.count).toBe(42);
    expect(result.name).toBe("test");
  });
});