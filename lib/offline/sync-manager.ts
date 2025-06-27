import { OfflineStorageService } from './storage-service';
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
    // Listen for online/offline events
    window.addEventListener('online', () => {
      console.log('Connection restored, starting sync...');
      this.startSync();
    });
    
    window.addEventListener('offline', () => {
      console.log('Connection lost, pausing sync...');
      this.stopSync();
    });
    
    // Start sync if online
    if (typeof window !== 'undefined' && navigator.onLine) {
      this.startSync();
    }
  }
  
  startSync() {
    // Sync every 30 seconds when online
    this.sync_interval = setInterval(() => {
      this.sync();
    }, 30000);
    
    // Also sync immediately
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
      return;
    }
    
    this.is_syncing = true;
    
    try {
      const sync_queue = await this.storage.getSyncQueue();
      
      for (const item of sync_queue) {
        try {
          await this.processSyncItem(item);
          await this.storage.removeSyncQueueItem(item.id);
        } catch (error) {
          console.error('Failed to sync item:', item, error);
          
          // Update retry count
          await this.storage.updateSyncQueueItem(item.id, {
            retry_count: item.retry_count + 1,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          
          // Remove from queue if too many retries
          if (item.retry_count >= 5) {
            await this.storage.removeSyncQueueItem(item.id);
          }
        }
      }
      
      // Pull latest data from server
      await this.pullServerData();
      
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.is_syncing = false;
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
      const token = await this.getAuthToken();
      
      if (item.operation === 'create') {
        const response = await fetch('/api/trpc/mealLog.add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'x-trpc-source': 'offline-sync',
          },
          body: JSON.stringify({
            batch: [{
              0: {
                json: {
                  food_id: meal_log.food_id,
                  portion_size_g: meal_log.portion_size_g,
                }
              }
            }]
          }),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        // Update local meal log with server ID
        await this.storage.updateMealLogWithServerId(meal_log.id, result.id);
        
      } else if (item.operation === 'delete') {
        const response = await fetch('/api/trpc/mealLog.delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'x-trpc-source': 'offline-sync',
          },
          body: JSON.stringify({
            batch: [{
              0: {
                json: meal_log.id
              }
            }]
          }),
        });
        
        if (!response.ok && response.status !== 404) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
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
        const response = await fetch('/api/trpc/user.updateSettings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'x-trpc-source': 'offline-sync',
          },
          body: JSON.stringify({
            batch: [{
              0: {
                json: {
                  daily_limit: user_settings.daily_limit,
                  weekly_limit: user_settings.weekly_limit,
                  monthly_limit: user_settings.monthly_limit,
                  tracking_period: user_settings.tracking_period,
                }
              }
            }]
          }),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
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
        const response = await fetch('/api/trpc/mealPreset.add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'x-trpc-source': 'offline-sync',
          },
          body: JSON.stringify({
            name: meal_preset.name,
            food_id: meal_preset.food_id,
            portion_size_g: meal_preset.portion_size_g,
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
      const meal_logs_response = await fetch('/api/trpc/mealLog.getToday?batch=1&input=' + encodeURIComponent(JSON.stringify({0:{json:{}}})), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-trpc-source': 'offline-sync',
        },
      });
      
      if (meal_logs_response.ok) {
        const response_data = await meal_logs_response.json();
        const meal_logs = response_data?.[0]?.result?.data?.json || [];
        
        // Update local storage with server data
        for (const log of meal_logs) {
          await this.storage.updateMealLogFromServer(log);
        }
      }
      
      // Pull user settings
      const settings_response = await fetch('/api/trpc/user.getSettings?batch=1&input=' + encodeURIComponent(JSON.stringify({0:{json:{}}})), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-trpc-source': 'offline-sync',
        },
      });
      
      if (settings_response.ok) {
        const response_data = await settings_response.json();
        const settings = response_data?.[0]?.result?.data?.json;
        if (settings) {
          await this.storage.updateUserSettingsFromServer(settings);
        }
      }
      
    } catch (error) {
      console.error('Failed to pull server data:', error);
      // Don't throw - pulling data is not critical
    }
  }
  
  private async getAuthToken(): Promise<string> {
    try {
      if (typeof window !== 'undefined') {
        // Dynamically import Clerk to avoid SSR issues
        const { Clerk } = window as Window & { Clerk?: { session?: { getToken: () => Promise<string> } } };
        
        if (Clerk && Clerk.session) {
          // Get the session token from Clerk
          const token = await Clerk.session.getToken();
          if (token) {
            return token;
          }
        }
        
        throw new Error('No authentication token available');
      }
      throw new Error('Window not available');
    } catch (error) {
      console.error('Failed to get auth token:', error);
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