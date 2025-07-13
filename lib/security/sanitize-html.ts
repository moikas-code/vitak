import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param dirty - The potentially unsafe HTML string
 * @returns Sanitized HTML string safe for rendering
 */
export function sanitizeHtml(dirty: string | null | undefined): string {
  if (!dirty) return '';
  
  // Configure DOMPurify for our use case
  const config = {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'span'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
    RETURN_TRUSTED_TYPE: false,
  };
  
  return DOMPurify.sanitize(dirty, config);
}

/**
 * Sanitizes plain text content (no HTML allowed)
 * @param text - The potentially unsafe text
 * @returns Sanitized plain text
 */
export function sanitizeText(text: string | null | undefined): string {
  if (!text) return '';
  
  // Remove all HTML tags and return plain text
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
}

/**
 * Type guard to check if a value needs sanitization
 */
export function needsSanitization(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}