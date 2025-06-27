import { get_offline_db } from './database';

export class TokenStorageService {
  private static instance: TokenStorageService;
  private token_cache: string | null = null;
  
  private constructor() {}
  
  static getInstance(): TokenStorageService {
    if (!TokenStorageService.instance) {
      TokenStorageService.instance = new TokenStorageService();
    }
    return TokenStorageService.instance;
  }
  
  async storeToken(token: string): Promise<void> {
    try {
      const db = await get_offline_db();
      
      // Store in IndexedDB for persistence
      await db.put('auth_tokens', {
        id: 'clerk_session_token',
        token,
        stored_at: new Date(),
        expires_at: new Date(Date.now() + 60 * 60 * 1000), // 1 hour expiry
      });
      
      // Update cache
      this.token_cache = token;
      
      // Also store in localStorage as backup
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('clerk_session_token', token);
          localStorage.setItem('clerk_token_stored_at', new Date().toISOString());
        } catch (e) {
          console.warn('Failed to store token in localStorage:', e);
        }
      }
    } catch (error) {
      console.error('Failed to store auth token:', error);
      throw error;
    }
  }
  
  async getStoredToken(): Promise<string | null> {
    try {
      // Check cache first
      if (this.token_cache) {
        return this.token_cache;
      }
      
      const db = await get_offline_db();
      const token_record = await db.get('auth_tokens', 'clerk_session_token');
      
      if (token_record && token_record.expires_at > new Date()) {
        this.token_cache = token_record.token;
        return token_record.token;
      }
      
      // Try localStorage as fallback
      if (typeof window !== 'undefined') {
        try {
          const stored_token = localStorage.getItem('clerk_session_token');
          const stored_at = localStorage.getItem('clerk_token_stored_at');
          
          if (stored_token && stored_at) {
            const token_age = Date.now() - new Date(stored_at).getTime();
            if (token_age < 60 * 60 * 1000) { // Less than 1 hour old
              this.token_cache = stored_token;
              // Re-store in IndexedDB
              await this.storeToken(stored_token);
              return stored_token;
            }
          }
        } catch (e) {
          console.warn('Failed to get token from localStorage:', e);
        }
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get stored token:', error);
      return null;
    }
  }
  
  async clearToken(): Promise<void> {
    try {
      const db = await get_offline_db();
      await db.delete('auth_tokens', 'clerk_session_token');
      
      this.token_cache = null;
      
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('clerk_session_token');
          localStorage.removeItem('clerk_token_stored_at');
        } catch (e) {
          console.warn('Failed to clear token from localStorage:', e);
        }
      }
    } catch (error) {
      console.error('Failed to clear token:', error);
    }
  }
  
  async isTokenExpired(): Promise<boolean> {
    try {
      const db = await get_offline_db();
      const token_record = await db.get('auth_tokens', 'clerk_session_token');
      
      if (!token_record) {
        return true;
      }
      
      return token_record.expires_at <= new Date();
    } catch (error) {
      console.error('Failed to check token expiry:', error);
      return true;
    }
  }
}