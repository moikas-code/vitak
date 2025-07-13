/**
 * Centralized configuration constants for VitaK Tracker
 */

// Rate limiting configurations
export const RATE_LIMITS = {
  FEEDBACK_MAX_LENGTH: 500,
  PRESET_NAME_MAX_LENGTH: 50,
  SEARCH_DEBOUNCE_MS: 300,
  SEARCH_MIN_LENGTH: 2,
  SEARCH_MAX_LENGTH: 100,
} as const;

// Vitamin K thresholds for visual indicators
export const VITAMIN_K_THRESHOLDS = {
  HIGH: 50, // mcg - Red indicator
  MEDIUM: 20, // mcg - Yellow indicator
  LOW: 0, // mcg - Green indicator
} as const;

// Default user settings
export const DEFAULT_USER_SETTINGS = {
  DAILY_LIMIT: 100,
  WEEKLY_LIMIT: 700,
  MONTHLY_LIMIT: 3000,
  TRACKING_PERIOD: 'daily' as const,
} as const;

// API configuration
export const API_CONFIG = {
  FOODS_SEARCH_LIMIT: 20,
  RECENT_MEALS_LIMIT: 10,
  MEAL_HISTORY_LIMIT: 50,
  COMMON_FOODS_LIMIT: 100,
} as const;

// Time configurations
export const TIME_CONFIG = {
  TOAST_DURATION: 5000, // ms
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 hours
} as const;

// Validation patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
} as const;

// PWA configuration
export const PWA_CONFIG = {
  OFFLINE_CACHE_NAME: 'vitak-offline-v1',
  STATIC_CACHE_NAME: 'vitak-static-v1',
  DYNAMIC_CACHE_NAME: 'vitak-dynamic-v1',
  MAX_DYNAMIC_CACHE_ITEMS: 50,
} as const;

// Feature flags
export const FEATURES = {
  OFFLINE_MODE: true,
  ANALYTICS: true,
  FEEDBACK: true,
  DONATIONS: true,
  MEAL_PRESETS: true,
} as const;

/**
 * Get vitamin K color class based on amount
 */
export function getVitaminKColor(mcg: number): string {
  if (mcg > VITAMIN_K_THRESHOLDS.HIGH) return "text-red-600";
  if (mcg > VITAMIN_K_THRESHOLDS.MEDIUM) return "text-yellow-600";
  return "text-green-600";
}

/**
 * Get vitamin K level label
 */
export function getVitaminKLevel(mcg: number): 'high' | 'medium' | 'low' {
  if (mcg > VITAMIN_K_THRESHOLDS.HIGH) return 'high';
  if (mcg > VITAMIN_K_THRESHOLDS.MEDIUM) return 'medium';
  return 'low';
}