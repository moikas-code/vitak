/**
 * Rate limiting using Cloudflare KV or in-memory fallback for local dev.
 *
 * On CF Workers: uses KV with sliding window algorithm.
 * Locally: uses in-memory Map with interval cleanup.
 */



export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export class RateLimitError extends Error {
  constructor(public resetTime: number) {
    super("Rate limit exceeded");
    this.name = "RateLimitError";
  }
}

// ─── In-memory fallback for local dev ────────────────────────────
interface RateLimitEntry {
  timestamps: number[];
}

const memoryStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every minute
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memoryStore.entries()) {
      entry.timestamps = entry.timestamps.filter((t) => now - t < 60000);
      if (entry.timestamps.length === 0) {
        memoryStore.delete(key);
      }
    }
  }, 60000);
}

function checkMemoryRateLimit(
  userId: string,
  operation: string,
  config: RateLimitConfig
): boolean {
  const key = `rate_limit:${userId}:${operation}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  let entry = memoryStore.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    memoryStore.set(key, entry);
  }

  // Remove old timestamps
  entry.timestamps = entry.timestamps.filter((t) => t > windowStart);

  if (entry.timestamps.length >= config.maxRequests) {
    const oldestInWindow = entry.timestamps[0];
    throw new RateLimitError(oldestInWindow + config.windowMs);
  }

  entry.timestamps.push(now);
  return true;
}

/**
 * Check if a user has exceeded their rate limit.
 * Uses Cloudflare KV in production, in-memory Map in dev.
 */
export async function checkRateLimit(
  userId: string,
  operation: string,
  config: RateLimitConfig
): Promise<boolean> {
  // Try Cloudflare KV first
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    const ctx = getCloudflareContext();
    const kv: KVNamespace | undefined = ctx.env?.RATE_LIMIT_KV;

    if (kv) {
      const key = `rate_limit:${userId}:${operation}`;
      const now = Date.now();
      const windowStart = now - config.windowMs;

      // Get current window data
      const data = await kv.get(key, "json") as { timestamps: number[] } | null;
      const timestamps = (data?.timestamps || []).filter((t: number) => t > windowStart);

      if (timestamps.length >= config.maxRequests) {
        const oldestInWindow = timestamps[0];
        throw new RateLimitError(oldestInWindow + config.windowMs);
      }

      // Add current request and store
      timestamps.push(now);
      await kv.put(key, JSON.stringify({ timestamps }), {
        expirationTtl: Math.ceil(config.windowMs / 1000),
      });

      return true;
    }
  } catch (error) {
    if (error instanceof RateLimitError) {
      throw error;
    }
    // KV not available, fall through to memory
  }

  // Fallback to in-memory rate limiting
  return checkMemoryRateLimit(userId, operation, config);
}

// Predefined rate limits
export const RATE_LIMITS = {
  MEAL_LOG: { windowMs: 60 * 60 * 1000, maxRequests: 100 },
  SETTINGS_UPDATE: { windowMs: 60 * 60 * 1000, maxRequests: 10 },
  FOOD_SEARCH: { windowMs: 60 * 1000, maxRequests: 60 },
  READ: { windowMs: 60 * 60 * 1000, maxRequests: 1000 },
  FEEDBACK: { windowMs: 60 * 60 * 1000, maxRequests: 5 },
  ADMIN_READ: { windowMs: 60 * 60 * 1000, maxRequests: 200 },
  ADMIN_WRITE: { windowMs: 60 * 60 * 1000, maxRequests: 50 },
  ADMIN_BULK: { windowMs: 60 * 60 * 1000, maxRequests: 10 },
};