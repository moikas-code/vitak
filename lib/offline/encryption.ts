import CryptoJS from 'crypto-js';
import { createLogger } from '@/lib/logger';

const logger = createLogger('offline-encryption');

/**
 * Generates a unique encryption key for the user based on their Clerk ID
 * Supports dual-iteration for backward compatibility during migration
 */
export function generate_encryption_key(user_id: string, use_legacy_iterations = false): string {
  // Generate a key based on user ID and a salt
  const salt = process.env.NEXT_PUBLIC_ENCRYPTION_SALT || 'vitak-tracker-salt';
  
  // Use stronger iterations for new data, but support legacy for existing data
  const iterations = use_legacy_iterations ? 1000 : 100000;
  
  return CryptoJS.PBKDF2(user_id, salt, {
    keySize: 256 / 32,
    iterations
  }).toString();
}

/**
 * Encrypts data using AES encryption with specified key
 */
export function encrypt_data<T>(data: T, encryption_key: string): string {
  const json_string = JSON.stringify(data);
  return CryptoJS.AES.encrypt(json_string, encryption_key).toString();
}

/**
 * Encrypts data using strong encryption (always uses new iterations)
 */
export function encrypt_data_strong<T>(data: T, user_id: string): string {
  const strong_key = generate_encryption_key(user_id, false);
  return encrypt_data(data, strong_key);
}

/**
 * Decrypts data that was encrypted with encrypt_data
 * Supports backward compatibility with legacy encryption
 */
export function decrypt_data<T>(encrypted_data: string, user_id: string): T {
  // First try with new strong iterations
  try {
    const strong_key = generate_encryption_key(user_id, false);
    const decrypted = CryptoJS.AES.decrypt(encrypted_data, strong_key);
    const json_string = decrypted.toString(CryptoJS.enc.Utf8);
    if (json_string) {
      return JSON.parse(json_string);
    }
  } catch {
    // If new key fails, try legacy key for backward compatibility
    logger.debug('Strong encryption failed, trying legacy', { user_id: user_id.substring(0, 8) + '...' });
  }
  
  // Fallback to legacy iterations for existing data
  try {
    const legacy_key = generate_encryption_key(user_id, true);
    const decrypted = CryptoJS.AES.decrypt(encrypted_data, legacy_key);
    const json_string = decrypted.toString(CryptoJS.enc.Utf8);
    if (json_string) {
      const result = JSON.parse(json_string);
      // TODO: Re-encrypt with stronger key in background
      return result;
    }
  } catch (error) {
    logger.error('Failed to decrypt data with both keys', error, { user_id: user_id.substring(0, 8) + '...' });
    throw new Error('Failed to decrypt data');
  }
  
  throw new Error('Failed to decrypt data - no valid key found');
}

/**
 * Stores the encryption key securely in the browser
 * Uses localStorage to persist across PWA sessions
 */
export function store_encryption_key(key: string): void {
  // Store persistently for PWA offline support
  if (typeof window !== 'undefined') {
    localStorage.setItem('vitak_encryption_key', key);
  }
}

/**
 * Retrieves the stored encryption key
 */
export function get_stored_encryption_key(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('vitak_encryption_key');
  }
  return null;
}

/**
 * Clears the stored encryption key (on logout)
 */
export function clear_encryption_key(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('vitak_encryption_key');
  }
}