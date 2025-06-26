import { OfflineStorageService } from './storage-service';
import type { VitaKOfflineDB } from './database';

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
    // In a real implementation, we would make direct fetch calls to the API
    // For now, we'll just log that sync is needed
    console.log('Sync needed for meal log:', item);
  }
  
  private async syncUserSettings(item: VitaKOfflineDB['sync_queue']['value']) {
    console.log('Sync needed for user settings:', item);
  }
  
  private async syncMealPreset(item: VitaKOfflineDB['sync_queue']['value']) {
    console.log('Sync needed for meal preset:', item);
  }
  
  private async pullServerData() {
    // In a real implementation, we would make direct fetch calls to pull data
    console.log('Pull server data needed');
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