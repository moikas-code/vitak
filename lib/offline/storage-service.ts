import { get_offline_db, type VitaKOfflineDB } from './database';
import { encrypt_data, decrypt_data, get_stored_encryption_key } from './encryption';
import type { MealLog, Food, UserSettings, MealPreset } from '@/lib/types';

export class OfflineStorageService {
  private static instance: OfflineStorageService;
  
  private constructor() {}
  
  static getInstance(): OfflineStorageService {
    if (!OfflineStorageService.instance) {
      OfflineStorageService.instance = new OfflineStorageService();
    }
    return OfflineStorageService.instance;
  }
  
  // Meal Logs Operations
  async addMealLog(meal_log: MealLog, _user_id: string): Promise<void> {
    const db = await get_offline_db();
    const encryption_key = get_stored_encryption_key();
    
    if (!encryption_key) {
      throw new Error('No encryption key available');
    }
    
    const encrypted_data = encrypt_data(meal_log, encryption_key);
    
    await db.add('meal_logs', {
      ...meal_log,
      is_synced: false,
      sync_status: 'pending',
      last_modified: new Date(),
      encrypted_data,
    });
    
    // Add to sync queue
    await this.addToSyncQueue('meal_log', 'create', meal_log);
  }
  
  async getMealLogs(user_id: string, start_date?: Date, end_date?: Date): Promise<MealLog[]> {
    const db = await get_offline_db();
    const encryption_key = get_stored_encryption_key();
    
    if (!encryption_key) {
      throw new Error('No encryption key available');
    }
    
    const tx = db.transaction('meal_logs', 'readonly');
    const index = tx.store.index('by-user');
    const meal_logs = await index.getAll(user_id);
    
    return meal_logs
      .filter(log => {
        if (start_date && new Date(log.logged_at) < start_date) return false;
        if (end_date && new Date(log.logged_at) > end_date) return false;
        return true;
      })
      .map(log => {
        if (log.encrypted_data) {
          return decrypt_data<MealLog>(log.encrypted_data, encryption_key);
        }
        return log as MealLog;
      })
      .sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime());
  }
  
  async deleteMealLog(id: string): Promise<void> {
    const db = await get_offline_db();
    const meal_log = await db.get('meal_logs', id);
    if (meal_log) {
      await db.delete('meal_logs', id);
      await this.addToSyncQueue('meal_log', 'delete', meal_log);
    }
  }
  
  // Food Cache Operations
  async cacheFood(food: Food): Promise<void> {
    const db = await get_offline_db();
    await db.put('foods', {
      ...food,
      last_accessed: new Date(),
      is_cached: true,
    });
  }
  
  async getCachedFoods(search?: string): Promise<Food[]> {
    const db = await get_offline_db();
    const all_foods = await db.getAll('foods');
    
    if (!search) {
      return all_foods.map(f => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { last_accessed, is_cached, ...food } = f;
        return food as Food;
      });
    }
    
    const search_lower = search.toLowerCase();
    return all_foods
      .filter(food => food.name.toLowerCase().includes(search_lower))
      .map(f => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { last_accessed, is_cached, ...food } = f;
        return food as Food;
      });
  }
  
  // User Settings Operations
  async saveUserSettings(settings: UserSettings): Promise<void> {
    const db = await get_offline_db();
    const encryption_key = get_stored_encryption_key();
    
    if (!encryption_key) {
      throw new Error('No encryption key available');
    }
    
    const encrypted_data = encrypt_data(settings, encryption_key);
    
    await db.put('user_settings', {
      ...settings,
      is_synced: false,
      last_modified: new Date(),
      encrypted_data,
    });
    
    await this.addToSyncQueue('user_settings', 'update', settings);
  }
  
  async getUserSettings(user_id: string): Promise<UserSettings | null> {
    const db = await get_offline_db();
    const encryption_key = get_stored_encryption_key();
    
    if (!encryption_key) {
      throw new Error('No encryption key available');
    }
    
    const settings = await db.get('user_settings', user_id);
    
    if (!settings) return null;
    
    if (settings.encrypted_data) {
      return decrypt_data<UserSettings>(settings.encrypted_data, encryption_key);
    }
    
    return settings as UserSettings;
  }
  
  // Meal Presets Operations
  async saveMealPreset(preset: MealPreset): Promise<void> {
    const db = await get_offline_db();
    const encryption_key = get_stored_encryption_key();
    
    if (!encryption_key) {
      throw new Error('No encryption key available');
    }
    
    const encrypted_data = encrypt_data(preset, encryption_key);
    
    await db.put('meal_presets', {
      ...preset,
      is_synced: false,
      last_modified: new Date(),
      encrypted_data,
    });
    
    await this.addToSyncQueue('meal_preset', 'create', preset);
  }
  
  async getMealPresets(user_id: string): Promise<MealPreset[]> {
    const db = await get_offline_db();
    const encryption_key = get_stored_encryption_key();
    
    if (!encryption_key) {
      throw new Error('No encryption key available');
    }
    
    const tx = db.transaction('meal_presets', 'readonly');
    const index = tx.store.index('by-user');
    const presets = await index.getAll(user_id);
    
    return presets.map(preset => {
      if (preset.encrypted_data) {
        return decrypt_data<MealPreset>(preset.encrypted_data, encryption_key);
      }
      return preset as MealPreset;
    });
  }
  
  async deleteMealPreset(id: string): Promise<void> {
    const db = await get_offline_db();
    const preset = await db.get('meal_presets', id);
    if (preset) {
      await db.delete('meal_presets', id);
      await this.addToSyncQueue('meal_preset', 'delete', preset);
    }
  }
  
  // Sync Queue Operations
  private async addToSyncQueue(
    type: 'meal_log' | 'user_settings' | 'meal_preset',
    operation: 'create' | 'update' | 'delete',
    data: MealLog | UserSettings | MealPreset
  ): Promise<void> {
    const db = await get_offline_db();
    
    await db.add('sync_queue', {
      id: `${type}_${operation}_${Date.now()}_${Math.random()}`,
      type,
      operation,
      data,
      created_at: new Date(),
      retry_count: 0,
    });
  }
  
  async getSyncQueue(): Promise<VitaKOfflineDB['sync_queue']['value'][]> {
    const db = await get_offline_db();
    const tx = db.transaction('sync_queue', 'readonly');
    const index = tx.store.index('by-created');
    return await index.getAll();
  }
  
  async removeSyncQueueItem(id: string): Promise<void> {
    const db = await get_offline_db();
    await db.delete('sync_queue', id);
  }
  
  async updateSyncQueueItem(id: string, updates: Partial<VitaKOfflineDB['sync_queue']['value']>): Promise<void> {
    const db = await get_offline_db();
    const item = await db.get('sync_queue', id);
    
    if (item) {
      await db.put('sync_queue', {
        ...item,
        ...updates,
      });
    }
  }
  
  // Check if we're online
  isOnline(): boolean {
    return typeof window !== 'undefined' ? navigator.onLine : false;
  }
  
  // Get unsynced items count
  async getUnsyncedCount(): Promise<number> {
    const db = await get_offline_db();
    const count = await db.count('sync_queue');
    return count;
  }
  
  // Sync-related helper methods
  async updateMealLogWithServerId(local_id: string, server_id: string): Promise<void> {
    const db = await get_offline_db();
    const meal_log = await db.get('meal_logs', local_id);
    
    if (meal_log) {
      await db.put('meal_logs', {
        ...meal_log,
        id: server_id,
        is_synced: true,
        sync_status: 'synced',
        last_modified: new Date(),
      });
      
      // Remove old entry if ID changed
      if (local_id !== server_id) {
        await db.delete('meal_logs', local_id);
      }
    }
  }
  
  async updateMealPresetWithServerId(local_id: string, server_id: string): Promise<void> {
    const db = await get_offline_db();
    const preset = await db.get('meal_presets', local_id);
    
    if (preset) {
      await db.put('meal_presets', {
        ...preset,
        id: server_id,
        is_synced: true,
        last_modified: new Date(),
      });
      
      // Remove old entry if ID changed
      if (local_id !== server_id) {
        await db.delete('meal_presets', local_id);
      }
    }
  }
  
  async updateMealLogFromServer(server_meal_log: MealLog): Promise<void> {
    const db = await get_offline_db();
    const encryption_key = get_stored_encryption_key();
    
    if (!encryption_key) {
      throw new Error('No encryption key available');
    }
    
    const encrypted_data = encrypt_data(server_meal_log, encryption_key);
    
    await db.put('meal_logs', {
      ...server_meal_log,
      is_synced: true,
      sync_status: 'synced',
      last_modified: new Date(),
      encrypted_data,
    });
  }
  
  async updateUserSettingsFromServer(server_settings: UserSettings): Promise<void> {
    const db = await get_offline_db();
    const encryption_key = get_stored_encryption_key();
    
    if (!encryption_key) {
      throw new Error('No encryption key available');
    }
    
    const encrypted_data = encrypt_data(server_settings, encryption_key);
    
    await db.put('user_settings', {
      ...server_settings,
      is_synced: true,
      last_modified: new Date(),
      encrypted_data,
    });
  }
}