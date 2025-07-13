import { Redis } from "@upstash/redis";

/**
 * Redis-based rate limiting for production use
 * Uses Upstash Redis for distributed rate limiting
 */

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

export class RateLimitError extends Error {
  constructor(public resetTime: number) {
    super("Rate limit exceeded");
    this.name = "RateLimitError";
  }
}

/**
 * Check if a user has exceeded their rate limit using Redis
 * @param userId - The user identifier
 * @param operation - The operation being performed
 * @param config - Rate limit configuration
 * @returns true if allowed, throws RateLimitError if exceeded
 */
export async function checkRateLimit(
  userId: string,
  operation: string,
  config: RateLimitConfig
): Promise<boolean> {
  const key = `rate_limit:${userId}:${operation}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  try {
    // Remove old entries outside the window
    await redis.zremrangebyscore(key, 0, windowStart);

    // Count requests in the current window
    const count = await redis.zcard(key);

    if (count >= config.maxRequests) {
      // Get the oldest request time to determine when the rate limit resets
      const oldestRequests = await redis.zrange(key, 0, 0, {
        withScores: true,
      }) as Array<{ score: number; member: string }>;
      
      const resetTime = oldestRequests.length > 0
        ? oldestRequests[0].score + config.windowMs
        : now + config.windowMs;
      
      throw new RateLimitError(resetTime);
    }

    // Add the current request
    await redis.zadd(key, {
      score: now,
      member: `${now}-${Math.random()}`, // Ensure unique members
    });

    // Set expiry on the key
    await redis.expire(key, Math.ceil(config.windowMs / 1000));

    return true;
  } catch (error) {
    // If Redis is down, fail open (allow the request)
    // but log the error for monitoring
    if (error instanceof RateLimitError) {
      throw error;
    }
    
    console.error("Rate limiting error:", error);
    return true;
  }
}

// Predefined rate limits for different operations
export const RATE_LIMITS = {
  // Meal logging: 100 per hour
  MEAL_LOG: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 100,
  },
  // Settings update: 10 per hour
  SETTINGS_UPDATE: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 10,
  },
  // Food search: 60 per minute
  FOOD_SEARCH: {
    windowMs: 60 * 1000,
    maxRequests: 60,
  },
  // General read operations: 1000 per hour
  READ: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 1000,
  },
  // Feedback: 5 per hour
  FEEDBACK: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 5,
  },
  // Admin read operations: 200 per hour
  ADMIN_READ: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 200,
  },
  // Admin write operations: 50 per hour
  ADMIN_WRITE: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 50,
  },
  // Admin bulk operations: 10 per hour
  ADMIN_BULK: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 10,
  },
};