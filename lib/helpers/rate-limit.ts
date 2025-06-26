import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export async function check_rate_limit(
  redis: Redis,
  identifier: string,
  limit: number = 10,
  window: number = 60
) {
  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, `${window} s`),
    analytics: true,
  });

  const { success, limit: rateLimitMax, reset, remaining } = await ratelimit.limit(
    `feedback_${identifier}`
  );

  return {
    allowed: success,
    limit: rateLimitMax,
    remaining,
    reset,
  };
}