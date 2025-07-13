import { get_offline_db } from './database';
import { createLogger } from '@/lib/logger';
import { offlineConfig } from '@/lib/config';

const logger = createLogger('token-storage');

// Token encryption utilities
class TokenEncryption {
  private static async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: offlineConfig.ENCRYPTION_ITERATIONS,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }

  static async encrypt(token: string, userId: string): Promise<{ encrypted: string; salt: string; iv: string }> {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const key = await this.deriveKey(userId, salt);
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(token)
    );

    return {
      encrypted: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
      salt: btoa(String.fromCharCode(...salt)),
      iv: btoa(String.fromCharCode(...iv))
    };
  }

  static async decrypt(encryptedData: { encrypted: string; salt: string; iv: string }, userId: string): Promise<string> {
    const decoder = new TextDecoder();
    const salt = new Uint8Array(atob(encryptedData.salt).split('').map(c => c.charCodeAt(0)));
    const iv = new Uint8Array(atob(encryptedData.iv).split('').map(c => c.charCodeAt(0)));
    const encrypted = new Uint8Array(atob(encryptedData.encrypted).split('').map(c => c.charCodeAt(0)));
    
    const key = await this.deriveKey(userId, salt);
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );

    return decoder.decode(decrypted);
  }
}

export class TokenStorageServiceV2 {
  private static instance: TokenStorageServiceV2;
  private token_cache: string | null = null;
  private migration_key = 'token_storage_migrated_v2';
  
  private constructor() {}
  
  static getInstance(): TokenStorageServiceV2 {
    if (!TokenStorageServiceV2.instance) {
      TokenStorageServiceV2.instance = new TokenStorageServiceV2();
    }
    return TokenStorageServiceV2.instance;
  }
  
  async storeToken(token: string, userId: string): Promise<void> {
    try {
      const db = await get_offline_db();
      
      // Encrypt the token
      const encryptedData = await TokenEncryption.encrypt(token, userId);
      
      // Store in IndexedDB for persistence
      await db.put('auth_tokens', {
        id: 'clerk_session_token_v2',
        encrypted_token: encryptedData.encrypted,
        salt: encryptedData.salt,
        iv: encryptedData.iv,
        stored_at: new Date(),
        expires_at: new Date(Date.now() + offlineConfig.TOKEN_EXPIRY_MS),
        version: 2
      });
      
      // Update cache
      this.token_cache = token;
      
      // Mark as migrated
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.migration_key, 'true');
      }
      
      logger.info('Token stored successfully', { userId });
    } catch (error) {
      logger.error('Failed to store auth token', error);
      throw error;
    }
  }
  
  async getStoredToken(userId: string): Promise<string | null> {
    try {
      // Check cache first
      if (this.token_cache) {
        return this.token_cache;
      }
      
      const db = await get_offline_db();
      
      // Try to get v2 token first
      const token_record = await db.get('auth_tokens', 'clerk_session_token_v2');
      
      if (token_record && token_record.expires_at > new Date() && token_record.version === 2) {
        // Check if v2 fields exist
        if (!token_record.encrypted_token || !token_record.salt || !token_record.iv) {
          logger.warn('V2 token record missing required fields');
          return null;
        }
        
        // Decrypt the token
        const decrypted = await TokenEncryption.decrypt({
          encrypted: token_record.encrypted_token,
          salt: token_record.salt,
          iv: token_record.iv
        }, userId);
        
        this.token_cache = decrypted;
        return decrypted;
      }
      
      // Check if we need to migrate from v1
      const migrated = typeof window !== 'undefined' && localStorage.getItem(this.migration_key) === 'true';
      
      if (!migrated) {
        // Try to get v1 token for migration
        const v1_record = await db.get('auth_tokens', 'clerk_session_token');
        
        if (v1_record && v1_record.expires_at > new Date() && v1_record.token) {
          logger.info('Migrating v1 token to v2');
          
          // Store the encrypted version
          await this.storeToken(v1_record.token, userId);
          
          // Clean up v1 token
          await db.delete('auth_tokens', 'clerk_session_token');
          
          // Clean up localStorage
          if (typeof window !== 'undefined') {
            localStorage.removeItem('clerk_session_token');
            localStorage.removeItem('clerk_token_stored_at');
          }
          
          return v1_record.token || null;
        }
        
        // Also check localStorage for v1 tokens
        if (typeof window !== 'undefined') {
          const stored_token = localStorage.getItem('clerk_session_token');
          const stored_at = localStorage.getItem('clerk_token_stored_at');
          
          if (stored_token && stored_at) {
            const token_age = Date.now() - new Date(stored_at).getTime();
            if (token_age < offlineConfig.TOKEN_EXPIRY_MS) {
              logger.info('Migrating localStorage token to v2');
              
              // Store encrypted version
              await this.storeToken(stored_token, userId);
              
              // Clean up localStorage
              localStorage.removeItem('clerk_session_token');
              localStorage.removeItem('clerk_token_stored_at');
              
              return stored_token;
            }
          }
        }
      }
      
      return null;
    } catch (error) {
      logger.error('Failed to get stored token', error);
      return null;
    }
  }
  
  async clearToken(): Promise<void> {
    try {
      const db = await get_offline_db();
      
      // Clear both v1 and v2 tokens
      await db.delete('auth_tokens', 'clerk_session_token');
      await db.delete('auth_tokens', 'clerk_session_token_v2');
      
      this.token_cache = null;
      
      if (typeof window !== 'undefined') {
        // Clear v1 localStorage tokens
        localStorage.removeItem('clerk_session_token');
        localStorage.removeItem('clerk_token_stored_at');
        // Keep migration flag to prevent re-migration attempts
      }
      
      logger.info('Token cleared successfully');
    } catch (error) {
      logger.error('Failed to clear token', error);
    }
  }
  
  async isTokenExpired(): Promise<boolean> {
    try {
      const db = await get_offline_db();
      const token_record = await db.get('auth_tokens', 'clerk_session_token_v2');
      
      if (!token_record) {
        // Check v1 token if v2 doesn't exist
        const v1_record = await db.get('auth_tokens', 'clerk_session_token');
        if (!v1_record) {
          return true;
        }
        return v1_record.expires_at <= new Date();
      }
      
      return token_record.expires_at <= new Date();
    } catch (error) {
      logger.error('Failed to check token expiry', error);
      return true;
    }
  }
}

// Export a compatibility wrapper that maintains the same interface
export class TokenStorageService {
  private static instance: TokenStorageService;
  private v2Service: TokenStorageServiceV2;
  private userId: string | null = null;
  
  private constructor() {
    this.v2Service = TokenStorageServiceV2.getInstance();
  }
  
  static getInstance(): TokenStorageService {
    if (!TokenStorageService.instance) {
      TokenStorageService.instance = new TokenStorageService();
    }
    return TokenStorageService.instance;
  }
  
  // Set user ID for encryption (should be called during initialization)
  setUserId(userId: string) {
    this.userId = userId;
  }
  
  async storeToken(token: string): Promise<void> {
    if (!this.userId) {
      logger.error('No user ID set for token encryption - cannot store token securely');
      throw new Error('User ID required for secure token storage');
    }
    return this.v2Service.storeToken(token, this.userId);
  }
  
  async getStoredToken(): Promise<string | null> {
    if (!this.userId) {
      logger.error('No user ID set for token decryption - cannot retrieve token securely');
      return null;
    }
    return this.v2Service.getStoredToken(this.userId);
  }
  
  async clearToken(): Promise<void> {
    return this.v2Service.clearToken();
  }
  
  async isTokenExpired(): Promise<boolean> {
    return this.v2Service.isTokenExpired();
  }
}