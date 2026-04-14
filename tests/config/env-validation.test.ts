import { describe, it, expect, vi } from "vitest";
import { validateEnvironment, isProduction, validateEnvOnStartup } from "@/lib/config/env-validation";

describe("validateEnvironment", () => {
  it("should return missing for required vars not set", () => {
    const originalValues: Record<string, string | undefined> = {};
    const requiredVars = ["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "CLERK_SECRET_KEY"];
    
    for (const key of requiredVars) {
      originalValues[key] = process.env[key];
      delete process.env[key];
    }

    const result = validateEnvironment();
    expect(result.valid).toBe(false);
    expect(result.missing).toContain("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY");
    expect(result.missing).toContain("CLERK_SECRET_KEY");

    // Restore
    for (const key of requiredVars) {
      if (originalValues[key] !== undefined) {
        process.env[key] = originalValues[key];
      }
    }
  });

  it("should validate when required vars are set", () => {
    const origKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    const origSecret = process.env.CLERK_SECRET_KEY;
    
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_xxx";
    process.env.CLERK_SECRET_KEY = "sk_test_xxx";

    const result = validateEnvironment();
    expect(result.missing).not.toContain("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY");
    expect(result.missing).not.toContain("CLERK_SECRET_KEY");

    // Restore
    if (origKey) process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = origKey;
    else delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    if (origSecret) process.env.CLERK_SECRET_KEY = origSecret;
    else delete process.env.CLERK_SECRET_KEY;
  });

  it("should warn about optional missing vars", () => {
    const result = validateEnvironment();
    expect(result.warnings).toBeDefined();
    expect(Array.isArray(result.warnings)).toBe(true);
  });
});

describe("isProduction", () => {
  it("should return true when NODE_ENV is production", () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    expect(isProduction()).toBe(true);
    process.env.NODE_ENV = original || "test";
  });

  it("should return false when NODE_ENV is development", () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    expect(isProduction()).toBe(false);
    process.env.NODE_ENV = original || "test";
  });

  it("should return false when NODE_ENV is test", () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = "test";
    expect(isProduction()).toBe(false);
    process.env.NODE_ENV = original || "test";
  });
});

describe("validateEnvOnStartup", () => {
  it("should return results object", () => {
    const result = validateEnvOnStartup();
    expect(result).toBeDefined();
    expect(result).toHaveProperty("valid");
    expect(result).toHaveProperty("missing");
    expect(result).toHaveProperty("warnings");
  });

  it("should not throw in development when required vars are missing", () => {
    const original = process.env.NODE_ENV;
    const origKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    const origSecret = process.env.CLERK_SECRET_KEY;
    
    process.env.NODE_ENV = "development";
    delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    delete process.env.CLERK_SECRET_KEY;

    expect(() => validateEnvOnStartup()).not.toThrow();

    process.env.NODE_ENV = original || "test";
    if (origKey) process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = origKey;
    if (origSecret) process.env.CLERK_SECRET_KEY = origSecret;
  });
});