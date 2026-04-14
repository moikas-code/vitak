import { describe, it, expect, beforeEach, vi } from "vitest";

// We need to test the in-memory rate limiter directly since the full
// module tries to use Cloudflare context. We'll test the core logic.

// Import after mocking
const { RateLimitError, RATE_LIMITS } = await import("@/lib/security/rate-limit");

describe("RateLimitError", () => {
  it("should be an instance of Error", () => {
    const error = new RateLimitError(Date.now() + 60000);
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(RateLimitError);
    expect(error.name).toBe("RateLimitError");
    expect(error.message).toBe("Rate limit exceeded");
  });

  it("should have a resetTime property", () => {
    const resetTime = Date.now() + 60000;
    const error = new RateLimitError(resetTime);
    expect(error.resetTime).toBe(resetTime);
  });
});

describe("RATE_LIMITS constants", () => {
  it("should have MEAL_LOG rate limit", () => {
    expect(RATE_LIMITS.MEAL_LOG).toBeDefined();
    expect(RATE_LIMITS.MEAL_LOG.windowMs).toBe(3600000);
    expect(RATE_LIMITS.MEAL_LOG.maxRequests).toBe(100);
  });

  it("should have FOOD_SEARCH rate limit", () => {
    expect(RATE_LIMITS.FOOD_SEARCH).toBeDefined();
    expect(RATE_LIMITS.FOOD_SEARCH.windowMs).toBe(60000);
    expect(RATE_LIMITS.FOOD_SEARCH.maxRequests).toBe(60);
  });

  it("should have SETTINGS_UPDATE rate limit", () => {
    expect(RATE_LIMITS.SETTINGS_UPDATE).toBeDefined();
    expect(RATE_LIMITS.SETTINGS_UPDATE.maxRequests).toBe(10);
  });

  it("should have FEEDBACK rate limit", () => {
    expect(RATE_LIMITS.FEEDBACK).toBeDefined();
    expect(RATE_LIMITS.FEEDBACK.maxRequests).toBe(5);
  });

  it("should have ADMIN_READ rate limit", () => {
    expect(RATE_LIMITS.ADMIN_READ).toBeDefined();
    expect(RATE_LIMITS.ADMIN_READ.maxRequests).toBe(200);
  });

  it("should have ADMIN_WRITE rate limit", () => {
    expect(RATE_LIMITS.ADMIN_WRITE).toBeDefined();
    expect(RATE_LIMITS.ADMIN_WRITE.maxRequests).toBe(50);
  });

  it("should have ADMIN_BULK rate limit", () => {
    expect(RATE_LIMITS.ADMIN_BULK).toBeDefined();
    expect(RATE_LIMITS.ADMIN_BULK.maxRequests).toBe(10);
  });

  it("should have READ rate limit", () => {
    expect(RATE_LIMITS.READ).toBeDefined();
    expect(RATE_LIMITS.READ.maxRequests).toBe(1000);
  });

  it("should have sensible rate limit ordering", () => {
    // READ should have highest allowance
    expect(RATE_LIMITS.READ.maxRequests).toBeGreaterThan(RATE_LIMITS.MEAL_LOG.maxRequests);
    expect(RATE_LIMITS.MEAL_LOG.maxRequests).toBeGreaterThan(RATE_LIMITS.ADMIN_WRITE.maxRequests);
    expect(RATE_LIMITS.ADMIN_WRITE.maxRequests).toBeGreaterThan(RATE_LIMITS.FEEDBACK.maxRequests);
    // ADMIN_BULK is most restrictive
    expect(RATE_LIMITS.ADMIN_BULK.maxRequests).toBeLessThan(RATE_LIMITS.ADMIN_WRITE.maxRequests);
  });
});

describe("checkRateLimit (in-memory fallback)", () => {
  it("should throw RateLimitError when limit exceeded", async () => {
    const { checkRateLimit } = await import("@/lib/security/rate-limit");
    const config = { windowMs: 60000, maxRequests: 1 };
    // Use a unique user ID to avoid state pollution from other tests
    const userId = `rl-test-${Date.now()}-${Math.random()}`;
    const op = `test-op-${Date.now()}`;

    // First request should succeed
    const result = await checkRateLimit(userId, op, config);
    expect(result).toBe(true);

    // Second request should throw
    await expect(checkRateLimit(userId, op, config)).rejects.toThrow(RateLimitError);
  });

  it("should allow requests under the limit", async () => {
    const { checkRateLimit } = await import("@/lib/security/rate-limit");
    const config = { windowMs: 60000, maxRequests: 100 };
    const userId = `rl-test-allowed-${Date.now()}`;
    const op = `test-op-allowed-${Date.now()}`;

    const result = await checkRateLimit(userId, op, config);
    expect(result).toBe(true);
  });

  it("should separate rate limits by operation", async () => {
    const { checkRateLimit } = await import("@/lib/security/rate-limit");
    const config = { windowMs: 60000, maxRequests: 1 };
    const userId = `rl-test-sep-${Date.now()}`;

    const result1 = await checkRateLimit(userId, `op-a-${Date.now()}`, config);
    const result2 = await checkRateLimit(userId, `op-b-${Date.now()}`, config);
    expect(result1).toBe(true);
    expect(result2).toBe(true);
  });
});