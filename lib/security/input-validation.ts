import { z } from "zod";

/**
 * Security patterns for input validation
 */
const SQL_INJECTION_PATTERN = /((\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|CREATE|ALTER|EXEC|EXECUTE|TRUNCATE|DECLARE|CAST|SET|FETCH|CURSOR|HAVING|MERGE)\b)|(--|\/\*|\*\/|@@|@|char|nchar|varchar|nvarchar|alter|begin|cast|create|cursor|declare|delete|drop|end|exec|execute|fetch|insert|kill|select|sys|sysobjects|syscolumns|table|update))/gi;

const SCRIPT_INJECTION_PATTERN = /(<script[\s\S]*?>[\s\S]*?<\/script>|javascript:|onerror=|onload=|onclick=|onmouseover=|<iframe|<embed|<object|eval\(|expression\(|prompt\(|alert\(|confirm\()/gi;

const HTML_TAG_PATTERN = /<[^>]+>/g;

/**
 * Validates feedback text for security issues
 */
export function validateFeedback(text: string): { isValid: boolean; error?: string } {
  if (!text || typeof text !== 'string') {
    return { isValid: false, error: 'Feedback text is required' };
  }

  if (text.length > 500) {
    return { isValid: false, error: 'Feedback must be 500 characters or less' };
  }

  if (SQL_INJECTION_PATTERN.test(text)) {
    return { isValid: false, error: 'Invalid characters detected in feedback' };
  }

  if (SCRIPT_INJECTION_PATTERN.test(text)) {
    return { isValid: false, error: 'Invalid content detected in feedback' };
  }

  return { isValid: true };
}

/**
 * Validates preset names
 */
export function validatePresetName(name: string): { isValid: boolean; error?: string } {
  if (!name || typeof name !== 'string') {
    return { isValid: false, error: 'Preset name is required' };
  }

  const trimmed = name.trim();
  
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Preset name cannot be empty' };
  }

  if (trimmed.length > 50) {
    return { isValid: false, error: 'Preset name must be 50 characters or less' };
  }

  if (HTML_TAG_PATTERN.test(trimmed)) {
    return { isValid: false, error: 'HTML tags are not allowed in preset names' };
  }

  if (SCRIPT_INJECTION_PATTERN.test(trimmed)) {
    return { isValid: false, error: 'Invalid content detected in preset name' };
  }

  return { isValid: true };
}

/**
 * Zod schema for feedback API validation
 */
export const feedbackSchema = z.object({
  rating: z.number().min(1).max(5),
  feedback: z.string().min(1).max(500).refine(
    (text) => !SQL_INJECTION_PATTERN.test(text) && !SCRIPT_INJECTION_PATTERN.test(text),
    { message: 'Invalid content detected in feedback' }
  ),
});

/**
 * Zod schema for meal preset validation
 */
export const mealPresetSchema = z.object({
  name: z.string().min(1).max(50).refine(
    (name) => !HTML_TAG_PATTERN.test(name) && !SCRIPT_INJECTION_PATTERN.test(name),
    { message: 'Invalid content in preset name' }
  ),
  food_id: z.string().uuid(),
  portion_size_g: z.number().positive(),
  vitamin_k_mcg: z.number().nonnegative(),
});

/**
 * Sanitizes search queries by removing special characters
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query || typeof query !== 'string') return '';
  
  // Remove potentially dangerous characters while keeping basic search functionality
  return query
    .replace(/[<>'"`;\\]/g, '') // Remove dangerous characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .slice(0, 100); // Limit length
}