/**
 * Analytics utility functions for Vercel Analytics
 * Provides type-safe custom event tracking while maintaining user anonymity
 */

import { track } from '@vercel/analytics';

// Event types for type safety
export type AnalyticsEvent = 
  | 'meal_logged'
  | 'food_searched'
  | 'food_selected'
  | 'dashboard_viewed'
  | 'settings_updated'
  | 'donate_clicked'
  | 'feedback_submitted'
  | 'credit_limit_changed'
  | 'meal_deleted'
  | 'export_requested'
  | 'filter_applied'
  | 'search_performed';

// Event properties interface
interface EventProperties {
  // Generic properties that don't contain PII
  category?: string;
  subcategory?: string;
  value?: number;
  anonymous_id?: string;
  feature?: string;
  action?: string;
}

/**
 * Track a custom analytics event
 * @param event - The event name
 * @param properties - Anonymous event properties
 */
export function track_event(event: AnalyticsEvent, properties?: EventProperties): void {
  try {
    // Ensure we don't accidentally track PII
    const safe_properties = sanitize_properties(properties);
    
    track(event, safe_properties);
  } catch (error) {
    // Fail silently in production, log in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('Analytics tracking failed:', error);
    }
  }
}

/**
 * Track meal logging events
 */
export function track_meal_event(action: 'started' | 'food_searched' | 'food_selected' | 'saved', data?: {
  food_category?: string;
  vitamin_k_amount?: 'low' | 'medium' | 'high';
  search_term_length?: number;
}): void {
  track_event('meal_logged', {
    category: 'meal_logging',
    action,
    subcategory: data?.food_category,
    value: data?.search_term_length,
    feature: data?.vitamin_k_amount,
  });
}

/**
 * Track dashboard navigation
 */
export function track_dashboard_event(page: 'dashboard' | 'log_meal' | 'history' | 'settings'): void {
  track_event('dashboard_viewed', {
    category: 'navigation',
    subcategory: page,
  });
}

/**
 * Track user settings changes
 */
export function track_settings_event(setting_type: 'credit_limit' | 'preferences' | 'profile'): void {
  track_event('settings_updated', {
    category: 'settings',
    subcategory: setting_type,
  });
}

/**
 * Track feature usage
 */
export function track_feature_event(feature: 'donate' | 'feedback' | 'export' | 'search'): void {
  const event_map: Record<string, AnalyticsEvent> = {
    donate: 'donate_clicked',
    feedback: 'feedback_submitted',
    export: 'export_requested',
    search: 'search_performed',
  };

  track_event(event_map[feature], {
    category: 'feature_usage',
    feature,
  });
}

/**
 * Track search and filtering behaviors
 */
export function track_search_event(type: 'food_search' | 'filter_applied', data?: {
  query_length?: number;
  results_count?: number;
  filter_type?: string;
}): void {
  const event = type === 'food_search' ? 'food_searched' : 'filter_applied';
  
  track_event(event, {
    category: 'search',
    action: type,
    value: data?.query_length || data?.results_count,
    subcategory: data?.filter_type,
  });
}

/**
 * Sanitize properties to ensure no PII is tracked
 */
function sanitize_properties(properties?: EventProperties): EventProperties | undefined {
  if (!properties) return undefined;

  // Remove any potentially sensitive data
  const safe_properties: EventProperties = {};

  // Only allow specific safe properties
  if (properties.category) safe_properties.category = properties.category;
  if (properties.subcategory) safe_properties.subcategory = properties.subcategory;
  if (properties.action) safe_properties.action = properties.action;
  if (properties.feature) safe_properties.feature = properties.feature;
  
  // Only allow numeric values (no strings that might contain PII)
  if (typeof properties.value === 'number') {
    safe_properties.value = properties.value;
  }

  // Generate anonymous session ID if needed
  if (properties.anonymous_id) {
    safe_properties.anonymous_id = generate_anonymous_id();
  }

  return Object.keys(safe_properties).length > 0 ? safe_properties : undefined;
}

/**
 * Generate anonymous session identifier
 */
function generate_anonymous_id(): string {
  return `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}