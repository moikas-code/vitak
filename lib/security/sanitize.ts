/**
 * Security utilities for input sanitization
 */

/**
 * Sanitize user input to prevent XSS attacks
 * Removes or escapes potentially dangerous characters
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Remove null bytes
  let sanitized = input.replace(/\0/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Remove or escape HTML/XML tags
  sanitized = sanitized.replace(/[<>]/g, (match) => {
    return match === '<' ? '&lt;' : '&gt;';
  });
  
  // Escape quotes
  sanitized = sanitized.replace(/["']/g, (match) => {
    return match === '"' ? '&quot;' : '&#x27;';
  });
  
  // Remove other potentially dangerous characters
  sanitized = sanitized.replace(/[&]/g, '&amp;');
  
  // Limit length to prevent DoS
  const MAX_LENGTH = 1000;
  if (sanitized.length > MAX_LENGTH) {
    sanitized = sanitized.substring(0, MAX_LENGTH);
  }
  
  return sanitized;
}

/**
 * Sanitize email addresses
 * Validates and normalizes email format
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    return '';
  }
  
  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  // Normalize and validate
  const normalized = email.toLowerCase().trim();
  
  if (!emailRegex.test(normalized)) {
    return '';
  }
  
  // Additional length check
  if (normalized.length > 254) { // RFC 5321
    return '';
  }
  
  return normalized;
}

/**
 * Sanitize username
 * Allows alphanumeric, underscores, and hyphens
 */
export function sanitizeUsername(username: string): string {
  if (!username || typeof username !== 'string') {
    return '';
  }
  
  // Allow only alphanumeric, underscore, hyphen
  let sanitized = username.replace(/[^a-zA-Z0-9_-]/g, '');
  
  // Limit length
  const MAX_LENGTH = 50;
  if (sanitized.length > MAX_LENGTH) {
    sanitized = sanitized.substring(0, MAX_LENGTH);
  }
  
  return sanitized;
}

/**
 * Sanitize general text fields (names, descriptions, etc.)
 * Preserves most characters but removes dangerous ones
 */
export function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  // Remove null bytes and trim
  let sanitized = text.replace(/\0/g, '').trim();
  
  // Remove control characters except newlines and tabs
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Limit length
  const MAX_LENGTH = 500;
  if (sanitized.length > MAX_LENGTH) {
    sanitized = sanitized.substring(0, MAX_LENGTH);
  }
  
  return sanitized;
}

/**
 * Sanitize URL
 * Validates and sanitizes URLs to prevent injection attacks
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }
  
  try {
    const parsed = new URL(url);
    
    // Only allow http/https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }
    
    return parsed.toString();
  } catch {
    return '';
  }
}

/**
 * Batch sanitize an object with multiple fields
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  fieldConfig: Record<keyof T, 'text' | 'email' | 'username' | 'url' | 'input'>
): T {
  const sanitized = { ...obj };
  
  for (const [field, type] of Object.entries(fieldConfig)) {
    const value = obj[field as keyof T];
    if (typeof value === 'string') {
      switch (type) {
        case 'text':
          sanitized[field as keyof T] = sanitizeText(value) as T[keyof T];
          break;
        case 'email':
          sanitized[field as keyof T] = sanitizeEmail(value) as T[keyof T];
          break;
        case 'username':
          sanitized[field as keyof T] = sanitizeUsername(value) as T[keyof T];
          break;
        case 'url':
          sanitized[field as keyof T] = sanitizeUrl(value) as T[keyof T];
          break;
        case 'input':
        default:
          sanitized[field as keyof T] = sanitizeInput(value) as T[keyof T];
          break;
      }
    }
  }
  
  return sanitized;
}