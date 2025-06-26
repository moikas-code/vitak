/**
 * Database operation rate limiting
 * Prevents abuse of database resources
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory rate limit store (consider Redis for production)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

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
 * Check if a user has exceeded their rate limit
 * @param userId - The user identifier
 * @param operation - The operation being performed
 * @param config - Rate limit configuration
 * @returns true if allowed, throws RateLimitError if exceeded
 */
export function checkRateLimit(
  userId: string,
  operation: string,
  config: RateLimitConfig
): boolean {
  const key = `${userId}:${operation}`;
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    // First request or window expired
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return true;
  }

  if (entry.count >= config.maxRequests) {
    throw new RateLimitError(entry.resetTime);
  }

  entry.count++;
  return true;
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
};