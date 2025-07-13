import { OfflineStorageService } from './storage-service';
import { TokenStorageService } from './token-storage';
import type { VitaKOfflineDB } from './database';
import type { MealLog, UserSettings, MealPreset } from '@/lib/types';
import { createLogger } from '@/lib/logger';
import { offlineConfig } from '@/lib/config';

const logger = createLogger('offline-sync');

export class SyncManager {
  private static instance: SyncManager;
  private storage: OfflineStorageService;
  private is_syncing: boolean = false;
  private sync_interval: NodeJS.Timeout | null = null;
  private online_handler: (() => void) | null = null;
  private offline_handler: (() => void) | null = null;
  
  private constructor() {
    this.storage = OfflineStorageService.getInstance();
    this.setupEventListeners();
  }
  
  static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager();
    }
    return SyncManager.instance;
  }
  
  private setupEventListeners() {
    logger.info('Setting up event listeners');
    
    // Create event handlers
    this.online_handler = () => {
      logger.info('Connection restored, starting sync');
      this.startSync();
      // Immediately sync when coming back online
      setTimeout(() => this.sync(), offlineConfig.SYNC_STABLE_DELAY_MS);
    };
    
    this.offline_handler = () => {
      logger.info('Connection lost, pausing sync');
      this.stopSync();
    };
    
    // Listen for online/offline events
    window.addEventListener('online', this.online_handler);
    window.addEventListener('offline', this.offline_handler);
    
    // Start sync if online
    const is_online = typeof window !== 'undefined' && navigator.onLine;
    logger.info('Initial online status', { isOnline: is_online });
    
    if (is_online) {
      logger.info('Starting initial sync');
      this.startSync();
    } else {
      logger.info('Starting offline - will sync when connection is restored');
    }
  }
  
  startSync() {
    logger.info('Starting sync service');
    
    // Clear any existing interval
    if (this.sync_interval) {
      logger.info('Clearing existing sync interval');
      clearInterval(this.sync_interval);
    }
    
    // Sync periodically when online
    this.sync_interval = setInterval(() => {
      logger.info('Periodic sync triggered');
      this.sync();
    }, offlineConfig.SYNC_INTERVAL_MS);
    
    logger.info('Sync interval set', { intervalMs: offlineConfig.SYNC_INTERVAL_MS });
    
    // Also sync immediately
    logger.info('Triggering immediate sync');
    this.sync();
  }
  
  stopSync() {
    if (this.sync_interval) {
      clearInterval(this.sync_interval);
      this.sync_interval = null;
    }
  }
  
  async sync() {
    if (this.is_syncing || (typeof window !== 'undefined' && !navigator.onLine)) {
      logger.info('Skipping sync - already syncing or offline');
      return;
    }
    
    logger.info('Starting sync process');
    this.is_syncing = true;
    
    try {
      const sync_queue = await this.storage.getSyncQueue();
      logger.info('Items in sync queue', { count: sync_queue.length });
      
      for (const item of sync_queue) {
        try {
          await this.processSyncItem(item);
          await this.storage.removeSyncQueueItem(item.id);
        } catch (error) {
          logger.error('Failed to sync item', error, { item });
          
          const error_message = error instanceof Error ? error.message : 'Unknown error';
          const is_auth_error = error_message.includes('AUTH_FAILED');
          
          // Update retry count
          await this.storage.updateSyncQueueItem(item.id, {
            retry_count: item.retry_count + 1,
            error: error_message,
          });
          
          // For auth errors, don't retry too many times
          const max_retries = is_auth_error ? 2 : 5;
          
          // Remove from queue if too many retries
          if (item.retry_count >= max_retries) {
            logger.warn(`Removing item from sync queue after ${item.retry_count} retries:`, { itemId: item.id });
            await this.storage.removeSyncQueueItem(item.id);
            
            // If it's an auth error, stop the sync entirely
            if (is_auth_error) {
              logger.error('Stopping sync due to authentication failure');
              throw new Error('Authentication failed - stopping sync');
            }
          }
        }
      }
      
      // Pull latest data from server
      await this.pullServerData();
      
      logger.info(' Sync completed successfully');
    } catch (error) {
      logger.error(' Sync failed:', { error });
    } finally {
      this.is_syncing = false;
      logger.info(' Sync process ended');
    }
  }
  
  private async processSyncItem(item: VitaKOfflineDB['sync_queue']['value']) {
    switch (item.type) {
      case 'meal_log':
        await this.syncMealLog(item);
        break;
      case 'user_settings':
        await this.syncUserSettings(item);
        break;
      case 'meal_preset':
        await this.syncMealPreset(item);
        break;
    }
  }
  
  private async syncMealLog(item: VitaKOfflineDB['sync_queue']['value']) {
    if (!item.data) {
      throw new Error('No data to sync');
    }
    
    const meal_log = item.data as MealLog;
    
    try {
      // Get auth token
      let token: string;
      try {
        token = await this.getAuthToken();
      } catch (auth_error) {
        logger.error('Authentication failed for meal log sync:', { error: auth_error });
        // Mark as authentication error for better handling
        throw new Error('AUTH_FAILED: ' + (auth_error instanceof Error ? auth_error.message : 'Unknown auth error'));
      }
      
      if (item.operation === 'create') {
        logger.info(' Creating meal log:', { mealLog: meal_log });
        
        const request_body = {
          json: {
            food_id: meal_log.food_id,
            portion_size_g: meal_log.portion_size_g,
          }
        };
        
        logger.info(' Request body', { body: request_body });
        logger.info(' Request headers', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token.substring(0, 20)}...`,
            'x-trpc-source': 'offline-sync',
          }
        });
        
        const response = await fetch('/api/trpc/mealLog.add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'x-trpc-source': 'offline-sync',
          },
          body: JSON.stringify(request_body),
        });
        
        logger.info(' Response status', { status: response.status, statusText: response.statusText });
        
        if (!response.ok) {
          const errorText = await response.text();
          logger.error(' Failed to create meal log', new Error(errorText), { status: response.status });
          logger.error(' Response headers', undefined, { headers: Object.fromEntries(response.headers.entries()) });
          throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
        }
        
        const result = await response.json();
        logger.info(' Create meal log response:', { result });
        
        // Extract the actual ID from the response
        const serverData = result?.result?.data?.json;
        if (serverData?.id) {
          // Update local meal log with server ID
          await this.storage.updateMealLogWithServerId(meal_log.id, serverData.id);
          logger.info(' Updated local meal log with server ID:', { serverId: serverData.id });
        } else {
          logger.warn(' No server ID in response:', { result });
        }
        
      } else if (item.operation === 'delete') {
        logger.info(' Deleting meal log:', { mealLogId: meal_log.id });
        
        const request_body = {
          json: meal_log.id
        };
        
        logger.info(' Delete request body', { body: request_body });
        
        const response = await fetch('/api/trpc/mealLog.delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'x-trpc-source': 'offline-sync',
          },
          body: JSON.stringify(request_body),
        });
        
        if (!response.ok && response.status !== 404) {
          const errorText = await response.text();
          logger.error(' Failed to delete meal log', new Error(errorText), { status: response.status });
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        logger.info(' Delete meal log successful');
        
        // Remove from local storage
        await this.storage.deleteMealLog(meal_log.id);
      }
      
    } catch (error) {
      logger.error('Failed to sync meal log:', { error });
      throw error;
    }
  }
  
  private async syncUserSettings(item: VitaKOfflineDB['sync_queue']['value']) {
    if (!item.data) {
      throw new Error('No data to sync');
    }
    
    const user_settings = item.data as UserSettings;
    
    try {
      const token = await this.getAuthToken();
      
      if (item.operation === 'update') {
        logger.info(' Updating user settings:', { userSettings: user_settings });
        const response = await fetch('/api/trpc/user.updateSettings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'x-trpc-source': 'offline-sync',
          },
          body: JSON.stringify({
            json: {
              daily_limit: user_settings.daily_limit,
              weekly_limit: user_settings.weekly_limit,
              monthly_limit: user_settings.monthly_limit,
              tracking_period: user_settings.tracking_period,
            }
          }),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          logger.error(' Failed to update settings', new Error(errorText), { status: response.status });
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        logger.info(' User settings updated successfully');
      }
      
    } catch (error) {
      logger.error('Failed to sync user settings:', { error });
      throw error;
    }
  }
  
  private async syncMealPreset(item: VitaKOfflineDB['sync_queue']['value']) {
    if (!item.data) {
      throw new Error('No data to sync');
    }
    
    const meal_preset = item.data as MealPreset;
    
    try {
      const token = await this.getAuthToken();
      
      if (item.operation === 'create') {
        logger.info(' Creating meal preset:', { mealPreset: meal_preset });
        logger.info(' Preset details:', {
          name: meal_preset.name,
          food_id: meal_preset.food_id,
          portion_size_g: meal_preset.portion_size_g,
          type_of_portion: typeof meal_preset.portion_size_g
        });
        const response = await fetch('/api/trpc/mealPreset.create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'x-trpc-source': 'offline-sync',
          },
          body: JSON.stringify({
            json: {
              name: meal_preset.name,
              food_id: meal_preset.food_id,
              portion_size_g: meal_preset.portion_size_g,
            }
          }),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          logger.error(' Failed to create meal preset', new Error(errorText), { status: response.status });
          
          // Check if it's a duplicate name error
          if (response.status === 400 && (errorText.includes('already exists') || errorText.includes('duplicate') || errorText.includes('23505'))) {
            logger.warn(' Preset with this name already exists, skipping sync');
            // Don't throw - just skip this preset
            return;
          }
          
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const result = await response.json();
        logger.info(' Create meal preset response:', { result });
        
        // Extract the actual ID from the response
        const serverData = result?.result?.data?.json;
        if (serverData?.id) {
          // Update local preset with server ID
          await this.storage.updateMealPresetWithServerId(meal_preset.id, serverData.id);
          logger.info(' Updated local meal preset with server ID:', { serverId: serverData.id });
        } else {
          logger.warn(' No server ID in response:', { result });
        }
        
      } else if (item.operation === 'delete') {
        const response = await fetch('/api/trpc/mealPreset.delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'x-trpc-source': 'offline-sync',
          },
          body: JSON.stringify({
            json: meal_preset.id
          }),
        });
        
        if (!response.ok && response.status !== 404) {
          const errorText = await response.text();
          logger.error(' Failed to delete meal preset', new Error(errorText), { status: response.status });
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
      }
      
    } catch (error) {
      logger.error('Failed to sync meal preset:', { error });
      throw error;
    }
  }
  
  private async pullServerData() {
    try {
      const token = await this.getAuthToken();
      
      // Pull today's meal logs
      logger.info(' Pulling today\'s meal logs from server...');
      const meal_logs_response = await fetch('/api/trpc/mealLog.getToday', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-trpc-source': 'offline-sync',
        },
      });
      
      if (meal_logs_response.ok) {
        const response_data = await meal_logs_response.json();
        logger.info(' Meal logs response:', { responseData: response_data });
        const meal_logs = response_data?.result?.data?.json || [];
        logger.info(' Found meal logs from server', { count: meal_logs.length });
        
        // Update local storage with server data
        for (const log of meal_logs) {
          await this.storage.updateMealLogFromServer(log);
        }
      } else if (meal_logs_response.status === 404) {
        logger.info(' No meal logs endpoint found (404)');
      } else {
        const error_text = await meal_logs_response.text();
        logger.error(' Failed to pull meal logs', new Error(error_text), { status: meal_logs_response.status });
      }
      
      // Pull user settings
      logger.info(' Pulling user settings from server...');
      const settings_response = await fetch('/api/trpc/user.getSettings', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-trpc-source': 'offline-sync',
        },
      });
      
      if (settings_response.ok) {
        const response_data = await settings_response.json();
        logger.info(' Settings response:', { responseData: response_data });
        const settings = response_data?.result?.data?.json;
        if (settings) {
          await this.storage.updateUserSettingsFromServer(settings);
          logger.info(' Updated user settings from server');
        }
      } else if (settings_response.status === 404) {
        // 404 is expected if user has no settings yet
        logger.info(' No user settings found on server (404) - this is normal for new users');
      } else {
        // Log the actual error for debugging
        const error_text = await settings_response.text();
        logger.error(' Failed to pull settings', new Error(error_text), { status: settings_response.status });
      }
      
    } catch (error) {
      logger.error('Failed to pull server data:', { error });
      // Don't throw - pulling data is not critical
    }
  }
  
  private async getAuthToken(): Promise<string> {
    try {
      // First try to get stored token
      const token_storage = TokenStorageService.getInstance();
      
      // Get user ID from storage to set for encryption
      const currentUser = await this.storage.getCurrentUserId();
      if (currentUser) {
        token_storage.setUserId(currentUser);
      }
      
      const stored_token = await token_storage.getStoredToken();
      
      if (stored_token) {
        // Check if token is expired
        const is_expired = await token_storage.isTokenExpired();
        if (!is_expired) {
          logger.info(' Using stored token');
          return stored_token;
        }
        logger.warn(' Stored token is expired, attempting to refresh...');
      }
      
      // If no stored token or expired, try to get from Clerk (if available)
      if (typeof window !== 'undefined') {
        const { Clerk } = window as Window & { Clerk?: { session?: { getToken: () => Promise<string> } } };
        
        logger.info(' Checking Clerk availability:', { hasClerk: !!Clerk, hasSession: !!Clerk?.session });
        
        if (Clerk && Clerk.session) {
          try {
            logger.info(' Getting fresh token from Clerk...');
            const fresh_token = await Clerk.session.getToken();
            if (fresh_token) {
              logger.info(' Got fresh token from Clerk', { length: fresh_token.length });
              // Store the fresh token for future use
              await token_storage.storeToken(fresh_token);
              return fresh_token;
            } else {
              logger.warn(' Clerk returned no token');
            }
          } catch (clerk_error) {
            logger.warn(' Failed to get token from Clerk:', { error: clerk_error });
          }
        } else {
          logger.warn(' Clerk not available in window');
        }
      }
      
      // Final fallback to stored token even if expired (better than nothing)
      if (stored_token) {
        logger.warn(' Using expired token as last resort', { length: stored_token.length });
        return stored_token;
      }
      
      throw new Error('No authentication token available');
    } catch (error) {
      logger.error(' Failed to get auth token:', { error });
      throw new Error('Authentication failed');
    }
  }
  
  // Force sync (called when user manually triggers)
  async forceSync() {
    await this.sync();
  }
  
  // Get sync status
  async getSyncStatus() {
    const unsynced_count = await this.storage.getUnsyncedCount();
    return {
      is_online: typeof window !== 'undefined' ? navigator.onLine : false,
      is_syncing: this.is_syncing,
      unsynced_count,
    };
  }
  
  // Cleanup method to prevent memory leaks
  cleanup() {
    logger.info(' Cleaning up sync manager...');
    
    // Stop sync interval
    this.stopSync();
    
    // Remove event listeners
    if (this.online_handler) {
      window.removeEventListener('online', this.online_handler);
      this.online_handler = null;
    }
    
    if (this.offline_handler) {
      window.removeEventListener('offline', this.offline_handler);
      this.offline_handler = null;
    }
    
    // Reset singleton instance
    SyncManager.instance = null as unknown as SyncManager;
  }
}