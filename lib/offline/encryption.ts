import CryptoJS from 'crypto-js';

/**
 * Generates a unique encryption key for the user based on their Clerk ID
 * This key is stored in the browser's secure storage
 */
export function generate_encryption_key(user_id: string): string {
  // Generate a key based on user ID and a salt
  const salt = process.env.NEXT_PUBLIC_ENCRYPTION_SALT || 'vitak-tracker-salt';
  return CryptoJS.PBKDF2(user_id, salt, {
    keySize: 256 / 32,
    iterations: 1000
  }).toString();
}

/**
 * Encrypts data using AES encryption
 */
export function encrypt_data<T>(data: T, encryption_key: string): string {
  const json_string = JSON.stringify(data);
  return CryptoJS.AES.encrypt(json_string, encryption_key).toString();
}

/**
 * Decrypts data that was encrypted with encrypt_data
 */
export function decrypt_data<T>(encrypted_data: string, encryption_key: string): T {
  try {
    const decrypted = CryptoJS.AES.decrypt(encrypted_data, encryption_key);
    const json_string = decrypted.toString(CryptoJS.enc.Utf8);
    return JSON.parse(json_string);
  } catch (error) {
    console.error('Failed to decrypt data:', error);
    throw new Error('Failed to decrypt data');
  }
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