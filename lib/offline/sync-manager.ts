import { OfflineStorageService } from './storage-service';
import { TokenStorageService } from './token-storage';
import type { VitaKOfflineDB } from './database';
import type { MealLog, UserSettings, MealPreset } from '@/lib/types';

export class SyncManager {
  private static instance: SyncManager;
  private storage: OfflineStorageService;
  private is_syncing: boolean = false;
  private sync_interval: NodeJS.Timeout | null = null;
  
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
    console.log('[Sync] Setting up event listeners...');
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      console.log('[Sync] Connection restored, starting sync...');
      this.startSync();
      // Immediately sync when coming back online
      setTimeout(() => this.sync(), 1000); // Small delay to ensure connection is stable
    });
    
    window.addEventListener('offline', () => {
      console.log('[Sync] Connection lost, pausing sync...');
      this.stopSync();
    });
    
    // Start sync if online
    const is_online = typeof window !== 'undefined' && navigator.onLine;
    console.log('[Sync] Initial online status:', is_online);
    
    if (is_online) {
      console.log('[Sync] Starting initial sync...');
      this.startSync();
    } else {
      console.log('[Sync] Starting offline - will sync when connection is restored');
    }
  }
  
  startSync() {
    console.log('[Sync] Starting sync service...');
    
    // Clear any existing interval
    if (this.sync_interval) {
      console.log('[Sync] Clearing existing sync interval');
      clearInterval(this.sync_interval);
    }
    
    // Sync every 30 seconds when online
    this.sync_interval = setInterval(() => {
      console.log('[Sync] Periodic sync triggered');
      this.sync();
    }, 30000);
    
    console.log('[Sync] Sync interval set for every 30 seconds');
    
    // Also sync immediately
    console.log('[Sync] Triggering immediate sync');
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
      console.log('[Sync] Skipping sync - already syncing or offline');
      return;
    }
    
    console.log('[Sync] Starting sync process...');
    this.is_syncing = true;
    
    try {
      const sync_queue = await this.storage.getSyncQueue();
      console.log('[Sync] Items in sync queue:', sync_queue.length);
      
      for (const item of sync_queue) {
        try {
          await this.processSyncItem(item);
          await this.storage.removeSyncQueueItem(item.id);
        } catch (error) {
          console.error('Failed to sync item:', item, error);
          
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
            console.warn(`Removing item from sync queue after ${item.retry_count} retries:`, item.id);
            await this.storage.removeSyncQueueItem(item.id);
            
            // If it's an auth error, stop the sync entirely
            if (is_auth_error) {
              console.error('Stopping sync due to authentication failure');
              throw new Error('Authentication failed - stopping sync');
            }
          }
        }
      }
      
      // Pull latest data from server
      await this.pullServerData();
      
      console.log('[Sync] Sync completed successfully');
    } catch (error) {
      console.error('[Sync] Sync failed:', error);
    } finally {
      this.is_syncing = false;
      console.log('[Sync] Sync process ended');
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
        console.error('Authentication failed for meal log sync:', auth_error);
        // Mark as authentication error for better handling
        throw new Error('AUTH_FAILED: ' + (auth_error instanceof Error ? auth_error.message : 'Unknown auth error'));
      }
      
      if (item.operation === 'create') {
        console.log('[Sync] Creating meal log:', meal_log);
        
        const request_body = {
          json: {
            food_id: meal_log.food_id,
            portion_size_g: meal_log.portion_size_g,
          }
        };
        
        console.log('[Sync] Request body:', JSON.stringify(request_body, null, 2));
        console.log('[Sync] Request headers:', {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token.substring(0, 20)}...`,
          'x-trpc-source': 'offline-sync',
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
        
        console.log('[Sync] Response status:', response.status, response.statusText);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('[Sync] Failed to create meal log:', response.status, errorText);
          console.error('[Sync] Response headers:', Object.fromEntries(response.headers.entries()));
          throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
        }
        
        const result = await response.json();
        console.log('[Sync] Create meal log response:', result);
        
        // Extract the actual ID from the response
        const serverData = result?.result?.data?.json;
        if (serverData?.id) {
          // Update local meal log with server ID
          await this.storage.updateMealLogWithServerId(meal_log.id, serverData.id);
          console.log('[Sync] Updated local meal log with server ID:', serverData.id);
        } else {
          console.warn('[Sync] No server ID in response:', result);
        }
        
      } else if (item.operation === 'delete') {
        console.log('[Sync] Deleting meal log:', meal_log.id);
        
        const request_body = {
          json: meal_log.id
        };
        
        console.log('[Sync] Delete request body:', JSON.stringify(request_body, null, 2));
        
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
          console.error('[Sync] Failed to delete meal log:', response.status, errorText);
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        console.log('[Sync] Delete meal log successful');
        
        // Remove from local storage
        await this.storage.deleteMealLog(meal_log.id);
      }
      
    } catch (error) {
      console.error('Failed to sync meal log:', error);
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
        console.log('[Sync] Updating user settings:', user_settings);
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
          console.error('[Sync] Failed to update settings:', response.status, errorText);
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        console.log('[Sync] User settings updated successfully');
      }
      
    } catch (error) {
      console.error('Failed to sync user settings:', error);
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
        console.log('[Sync] Creating meal preset:', meal_preset);
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
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        // Update local preset with server ID
        await this.storage.updateMealPresetWithServerId(meal_preset.id, result.id);
        
      } else if (item.operation === 'delete') {
        const response = await fetch('/api/trpc/mealPreset.delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'x-trpc-source': 'offline-sync',
          },
          body: JSON.stringify(meal_preset.id),
        });
        
        if (!response.ok && response.status !== 404) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }
      
    } catch (error) {
      console.error('Failed to sync meal preset:', error);
      throw error;
    }
  }
  
  private async pullServerData() {
    try {
      const token = await this.getAuthToken();
      
      // Pull today's meal logs
      console.log('[Sync] Pulling today\'s meal logs from server...');
      const meal_logs_response = await fetch('/api/trpc/mealLog.getToday', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-trpc-source': 'offline-sync',
        },
      });
      
      if (meal_logs_response.ok) {
        const response_data = await meal_logs_response.json();
        console.log('[Sync] Meal logs response:', response_data);
        const meal_logs = response_data?.result?.data?.json || [];
        console.log('[Sync] Found', meal_logs.length, 'meal logs from server');
        
        // Update local storage with server data
        for (const log of meal_logs) {
          await this.storage.updateMealLogFromServer(log);
        }
      } else if (meal_logs_response.status === 404) {
        console.log('[Sync] No meal logs endpoint found (404)');
      } else {
        const error_text = await meal_logs_response.text();
        console.error('[Sync] Failed to pull meal logs:', meal_logs_response.status, error_text);
      }
      
      // Pull user settings
      console.log('[Sync] Pulling user settings from server...');
      const settings_response = await fetch('/api/trpc/user.getSettings', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-trpc-source': 'offline-sync',
        },
      });
      
      if (settings_response.ok) {
        const response_data = await settings_response.json();
        console.log('[Sync] Settings response:', response_data);
        const settings = response_data?.result?.data?.json;
        if (settings) {
          await this.storage.updateUserSettingsFromServer(settings);
          console.log('[Sync] Updated user settings from server');
        }
      } else if (settings_response.status === 404) {
        // 404 is expected if user has no settings yet
        console.log('[Sync] No user settings found on server (404) - this is normal for new users');
      } else {
        // Log the actual error for debugging
        const error_text = await settings_response.text();
        console.error('[Sync] Failed to pull settings:', settings_response.status, error_text);
      }
      
    } catch (error) {
      console.error('Failed to pull server data:', error);
      // Don't throw - pulling data is not critical
    }
  }
  
  private async getAuthToken(): Promise<string> {
    try {
      // First try to get stored token
      const token_storage = TokenStorageService.getInstance();
      const stored_token = await token_storage.getStoredToken();
      
      if (stored_token) {
        // Check if token is expired
        const is_expired = await token_storage.isTokenExpired();
        if (!is_expired) {
          console.log('[Sync] Using stored token');
          return stored_token;
        }
        console.warn('[Sync] Stored token is expired, attempting to refresh...');
      }
      
      // If no stored token or expired, try to get from Clerk (if available)
      if (typeof window !== 'undefined') {
        const { Clerk } = window as Window & { Clerk?: { session?: { getToken: () => Promise<string> } } };
        
        console.log('[Sync] Checking Clerk availability:', !!Clerk, !!Clerk?.session);
        
        if (Clerk && Clerk.session) {
          try {
            console.log('[Sync] Getting fresh token from Clerk...');
            const fresh_token = await Clerk.session.getToken();
            if (fresh_token) {
              console.log('[Sync] Got fresh token from Clerk, length:', fresh_token.length);
              // Store the fresh token for future use
              await token_storage.storeToken(fresh_token);
              return fresh_token;
            } else {
              console.warn('[Sync] Clerk returned no token');
            }
          } catch (clerk_error) {
            console.warn('[Sync] Failed to get token from Clerk:', clerk_error);
          }
        } else {
          console.warn('[Sync] Clerk not available in window');
        }
      }
      
      // Final fallback to stored token even if expired (better than nothing)
      if (stored_token) {
        console.warn('[Sync] Using expired token as last resort, length:', stored_token.length);
        return stored_token;
      }
      
      throw new Error('No authentication token available');
    } catch (error) {
      console.error('[Sync] Failed to get auth token:', error);
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
}