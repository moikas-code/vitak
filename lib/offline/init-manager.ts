import { generate_encryption_key, store_encryption_key, get_stored_encryption_key } from './encryption';
import { init_offline_database } from './database';
import { TokenStorageService } from './token-storage';
import { SyncManager } from './sync-manager';
import { populateFoodCache } from './food-cache';

export class OfflineInitManager {
  private static instance: OfflineInitManager;
  private init_promise: Promise<boolean> | null = null;
  private is_initialized = false;
  private user_id: string | null = null;
  
  private constructor() {}
  
  static getInstance(): OfflineInitManager {
    if (!OfflineInitManager.instance) {
      OfflineInitManager.instance = new OfflineInitManager();
    }
    return OfflineInitManager.instance;
  }
  
  async initialize(user_id: string, getToken?: () => Promise<string | null>): Promise<boolean> {
    // If already initialized for this user, return immediately
    if (this.is_initialized && this.user_id === user_id) {
      console.log('[OfflineInit] Already initialized for user:', user_id);
      return true;
    }
    
    // If initialization is in progress, wait for it
    if (this.init_promise) {
      console.log('[OfflineInit] Initialization already in progress, waiting...');
      return this.init_promise;
    }
    
    // Start new initialization
    console.log('[OfflineInit] Starting initialization for user:', user_id);
    this.user_id = user_id;
    
    this.init_promise = this.performInitialization(user_id, getToken);
    
    try {
      const result = await this.init_promise;
      this.is_initialized = result;
      return result;
    } finally {
      this.init_promise = null;
    }
  }
  
  private async performInitialization(user_id: string, getToken?: () => Promise<string | null>): Promise<boolean> {
    try {
      console.log('[OfflineInit] Performing initialization steps...');
      
      // Step 1: Check if encryption key exists, if not generate and store it
      let encryption_key = get_stored_encryption_key();
      if (!encryption_key) {
        console.log('[OfflineInit] Generating new encryption key');
        encryption_key = generate_encryption_key(user_id);
        store_encryption_key(encryption_key);
      } else {
        console.log('[OfflineInit] Using existing encryption key');
      }
      
      // Step 2: Initialize database
      console.log('[OfflineInit] Initializing database...');
      await init_offline_database();
      console.log('[OfflineInit] Database initialized');
      
      // Step 3: Try to store current auth token if available
      if (getToken) {
        try {
          const token = await getToken();
          if (token) {
            await TokenStorageService.getInstance().storeToken(token);
            console.log('[OfflineInit] Initial auth token stored');
          } else {
            console.warn('[OfflineInit] No auth token available during init');
          }
        } catch (error) {
          console.warn('[OfflineInit] Failed to store initial auth token:', error);
          // Don't fail initialization if token storage fails
        }
      }
      
      // Step 4: Start sync manager
      SyncManager.getInstance();
      console.log('[OfflineInit] Sync manager started');
      
      // Step 5: Pre-populate food cache (non-blocking)
      populateFoodCache().then(() => {
        console.log('[OfflineInit] Food cache population completed');
      }).catch(error => {
        console.warn('[OfflineInit] Food cache population failed:', error);
      });
      
      console.log('[OfflineInit] Initialization completed successfully');
      return true;
      
    } catch (error) {
      console.error('[OfflineInit] Initialization failed:', error);
      this.is_initialized = false;
      return false;
    }
  }
  
  async ensureInitialized(user_id: string): Promise<boolean> {
    if (this.is_initialized && this.user_id === user_id) {
      return true;
    }
    
    // Wait for any ongoing initialization
    if (this.init_promise) {
      return this.init_promise;
    }
    
    // Initialize without token (for cases where we just need the database)
    return this.initialize(user_id);
  }
  
  isInitialized(): boolean {
    return this.is_initialized;
  }
  
  reset(): void {
    console.log('[OfflineInit] Resetting initialization state');
    this.is_initialized = false;
    this.user_id = null;
    this.init_promise = null;
  }
}