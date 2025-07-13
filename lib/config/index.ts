/**
 * Centralized configuration management
 * All hardcoded values should be moved here
 */

// Offline sync configuration
export const OFFLINE_CONFIG = {
  // Sync intervals
  SYNC_INTERVAL_MS: 30 * 1000, // 30 seconds
  SYNC_RETRY_COUNT: 3,
  SYNC_RETRY_DELAY_MS: 5000,
  SYNC_STABLE_DELAY_MS: 1000, // Delay when coming back online
  
  // Token management
  TOKEN_EXPIRY_MS: 60 * 60 * 1000, // 1 hour
  TOKEN_REFRESH_INTERVAL_MS: 5 * 60 * 1000, // 5 minutes
  
  // Database
  DB_OPERATION_TIMEOUT_MS: 30 * 1000, // 30 seconds
  DB_NAME: 'vitak-offline-db',
  DB_VERSION: 7,
  
  // Encryption
  ENCRYPTION_ITERATIONS: 100000,
  ENCRYPTION_SALT_LENGTH: 16,
  ENCRYPTION_IV_LENGTH: 12,
  
  // Food cache
  FOOD_CACHE_SIZE: 100,
  FOOD_CACHE_TTL_MS: 24 * 60 * 60 * 1000, // 24 hours
} as const;

// Rate limiting configuration
export const RATE_LIMIT_CONFIG = {
  // Window cleanup interval
  CLEANUP_INTERVAL_MS: 5 * 60 * 1000, // 5 minutes
  
  // Default rate limits
  DEFAULT_WINDOW_MS: 60 * 60 * 1000, // 1 hour
  DEFAULT_MAX_REQUESTS: 100,
} as const;

// API configuration
export const API_CONFIG = {
  // Request timeouts
  DEFAULT_TIMEOUT_MS: 30 * 1000, // 30 seconds
  UPLOAD_TIMEOUT_MS: 60 * 1000, // 1 minute
  
  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,
  RETRY_BACKOFF_MULTIPLIER: 2,
  
  // Headers
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
  },
} as const;

// Security configuration
export const SECURITY_CONFIG = {
  // Password requirements
  MIN_PASSWORD_LENGTH: 8,
  
  // Session configuration
  SESSION_TIMEOUT_MS: 30 * 60 * 1000, // 30 minutes
  SESSION_EXTEND_THRESHOLD_MS: 5 * 60 * 1000, // 5 minutes
  
  // CORS
  ALLOWED_ORIGINS: process.env.NODE_ENV === 'development' 
    ? ['http://localhost:3000'] 
    : [process.env.NEXT_PUBLIC_APP_URL || 'https://vitak.app'],
} as const;

// Feature flags
export const FEATURES = {
  // Offline features
  OFFLINE_MODE: true,
  OFFLINE_SYNC: true,
  OFFLINE_ENCRYPTION: true,
  
  // Security features
  RATE_LIMITING: true,
  TOKEN_ENCRYPTION: true,
  
  // Debug features (should be false in production)
  DEBUG_LOGGING: process.env.NODE_ENV === 'development',
  DEBUG_ENDPOINTS: false, // Always false after audit
} as const;

// Helper to get environment-aware configuration
export function getConfig<T extends Record<string, unknown>>(
  config: T,
  overrides?: Partial<T>
): T {
  // Allow environment variable overrides
  const envOverrides: Partial<T> = {};
  
  for (const key in config) {
    const envKey = `NEXT_PUBLIC_${key}`;
    const envValue = process.env[envKey];
    
    if (envValue !== undefined) {
      // Parse numbers and booleans
      if (!isNaN(Number(envValue))) {
        envOverrides[key] = Number(envValue) as T[typeof key];
      } else if (envValue === 'true' || envValue === 'false') {
        envOverrides[key] = (envValue === 'true') as T[typeof key];
      } else {
        envOverrides[key] = envValue as T[typeof key];
      }
    }
  }
  
  return {
    ...config,
    ...envOverrides,
    ...overrides,
  };
}

// Export configured values
export const offlineConfig = getConfig(OFFLINE_CONFIG);
export const rateLimitConfig = getConfig(RATE_LIMIT_CONFIG);
export const apiConfig = getConfig(API_CONFIG);
export const securityConfig = getConfig(SECURITY_CONFIG);
export const features = getConfig(FEATURES);