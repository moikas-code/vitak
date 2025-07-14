/**
 * Security headers for production API responses
 */

export interface SecurityHeaders {
  'X-Content-Type-Options': string;
  'X-Frame-Options': string;
  'X-XSS-Protection': string;
  'Referrer-Policy': string;
  'Permissions-Policy': string;
  'Strict-Transport-Security'?: string;
  'Content-Security-Policy'?: string;
}

/**
 * Get default security headers for API responses
 */
export function getSecurityHeaders(options?: {
  includeHSTS?: boolean;
  includeCSP?: boolean;
}): SecurityHeaders {
  const headers: SecurityHeaders = {
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    
    // Prevent embedding in frames
    'X-Frame-Options': 'DENY',
    
    // XSS protection
    'X-XSS-Protection': '1; mode=block',
    
    // Referrer policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Permissions policy - disable unnecessary features
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  };

  // Add HSTS header for HTTPS connections
  if (options?.includeHSTS) {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
  }

  // Add basic CSP header
  if (options?.includeCSP) {
    headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:; font-src 'self' data:;";
  }

  return headers;
}

/**
 * Apply security headers to a Response object
 */
export function withSecurityHeaders(
  response: Response, 
  options?: { includeHSTS?: boolean; includeCSP?: boolean }
): Response {
  const headers = getSecurityHeaders(options);
  
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  
  return response;
}

/**
 * Create a new Response with security headers
 */
export function createSecureResponse(
  body?: BodyInit | null,
  init?: ResponseInit,
  securityOptions?: { includeHSTS?: boolean; includeCSP?: boolean }
): Response {
  const response = new Response(body, init);
  return withSecurityHeaders(response, securityOptions);
}

/**
 * Security headers for JSON API responses
 */
export function jsonResponseWithHeaders(
  data: unknown,
  init?: ResponseInit,
  securityOptions?: { includeHSTS?: boolean; includeCSP?: boolean }
): Response {
  const responseInit: ResponseInit = {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  };
  
  const response = new Response(JSON.stringify(data), responseInit);
  return withSecurityHeaders(response, securityOptions);
}