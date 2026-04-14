/**
 * Analytics utility — Cloudflare Workers compatible.
 * Uses console tracking for now. Can be swapped for CF Web Analytics.
 */

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

interface EventProperties {
  category?: string;
  subcategory?: string;
  value?: number;
  anonymous_id?: string;
  feature?: string;
  action?: string;
}

/**
 * Track a custom analytics event
 * Currently logs to console. Replace with CF Web Analytics or any other provider.
 */
export function track_event(event: AnalyticsEvent, properties?: EventProperties): void {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Analytics] ${event}`, properties);
    }
    // Production: send to your analytics provider
  } catch {
    // Fail silently
  }
}

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

export function track_dashboard_event(page: 'dashboard' | 'log_meal' | 'history' | 'settings'): void {
  track_event('dashboard_viewed', {
    category: 'navigation',
    subcategory: page,
  });
}

export function track_settings_event(setting_type: 'credit_limit' | 'preferences' | 'profile'): void {
  track_event('settings_updated', {
    category: 'settings',
    subcategory: setting_type,
  });
}

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