import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, RateLimitError, RateLimitConfig } from '@/lib/security/rate-limit-redis';
import { getSecurityHeaders } from '@/lib/security/headers';

/**
 * Rate limiting middleware for API routes
 */
export async function withRateLimit(
  req: NextRequest,
  userId: string | null,
  operation: string,
  config: RateLimitConfig,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  // Use IP address for anonymous requests
  const identifier = userId || req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'anonymous';
  
  try {
    await checkRateLimit(identifier, operation, config);
    const response = await handler();
    
    // Add security headers to successful responses
    const securityHeaders = getSecurityHeaders();
    for (const [key, value] of Object.entries(securityHeaders)) {
      response.headers.set(key, value);
    }
    
    return response;
  } catch (error) {
    if (error instanceof RateLimitError) {
      const securityHeaders = getSecurityHeaders();
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { 
          status: 429,
          headers: {
            ...securityHeaders,
            'Retry-After': String(Math.ceil((error.resetTime - Date.now()) / 1000)),
            'X-RateLimit-Limit': String(config.maxRequests),
            'X-RateLimit-Window': String(config.windowMs / 1000),
          }
        }
      );
    }
    throw error;
  }
}

// API-specific rate limits
export const API_RATE_LIMITS = {
  // Auth sync: 20 per hour per user/IP
  AUTH_SYNC: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 20,
  },
  // Stripe checkout: 10 per hour per user
  STRIPE_CHECKOUT: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 10,
  },
  // Webhook endpoints: 100 per minute (for the service, not per user)
  WEBHOOK: {
    windowMs: 60 * 1000,
    maxRequests: 100,
  },
};