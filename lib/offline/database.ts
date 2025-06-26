import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { MealLog, Food, UserSettings, MealPreset } from '@/lib/types';

export interface VitaKOfflineDB extends DBSchema {
  meal_logs: {
    key: string;
    value: MealLog & {
      is_synced: boolean;
      sync_status: 'pending' | 'synced' | 'error';
      last_modified: Date;
      encrypted_data?: string;
    };
    indexes: {
      'by-user': string;
      'by-sync-status': string;
      'by-logged-at': Date;
    };
  };
  
  foods: {
    key: string;
    value: Food & {
      last_accessed: Date;
      is_cached: boolean;
    };
    indexes: {
      'by-name': string;
      'by-category': string;
    };
  };
  
  user_settings: {
    key: string; // user_id
    value: UserSettings & {
      is_synced: boolean;
      last_modified: Date;
      encrypted_data?: string;
    };
  };
  
  meal_presets: {
    key: string;
    value: MealPreset & {
      is_synced: boolean;
      last_modified: Date;
      encrypted_data?: string;
    };
    indexes: {
      'by-user': string;
    };
  };
  
  sync_queue: {
    key: string;
    value: {
      id: string;
      type: 'meal_log' | 'user_settings' | 'meal_preset';
      operation: 'create' | 'update' | 'delete';
      data: MealLog | UserSettings | MealPreset;
      created_at: Date;
      retry_count: number;
      error?: string;
    };
    indexes: {
      'by-created': Date;
      'by-type': string;
    };
  };
}

const DB_NAME = 'vitak-offline-db';
const DB_VERSION = 1;

let db_instance: IDBPDatabase<VitaKOfflineDB> | null = null;

export async function init_offline_database(): Promise<IDBPDatabase<VitaKOfflineDB>> {
  if (db_instance) return db_instance;
  
  db_instance = await openDB<VitaKOfflineDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create meal_logs store
      if (!db.objectStoreNames.contains('meal_logs')) {
        const meal_logs_store = db.createObjectStore('meal_logs', { keyPath: 'id' });
        meal_logs_store.createIndex('by-user', 'user_id');
        meal_logs_store.createIndex('by-sync-status', 'sync_status');
        meal_logs_store.createIndex('by-logged-at', 'logged_at');
      }
      
      // Create foods store (for caching frequently used foods)
      if (!db.objectStoreNames.contains('foods')) {
        const foods_store = db.createObjectStore('foods', { keyPath: 'id' });
        foods_store.createIndex('by-name', 'name');
        foods_store.createIndex('by-category', 'category');
      }
      
      // Create user_settings store
      if (!db.objectStoreNames.contains('user_settings')) {
        db.createObjectStore('user_settings', { keyPath: 'user_id' });
      }
      
      // Create meal_presets store
      if (!db.objectStoreNames.contains('meal_presets')) {
        const presets_store = db.createObjectStore('meal_presets', { keyPath: 'id' });
        presets_store.createIndex('by-user', 'user_id');
      }
      
      // Create sync_queue store for offline operations
      if (!db.objectStoreNames.contains('sync_queue')) {
        const sync_store = db.createObjectStore('sync_queue', { keyPath: 'id' });
        sync_store.createIndex('by-created', 'created_at');
        sync_store.createIndex('by-type', 'type');
      }
    },
  });
  
  return db_instance;
}

export async function get_offline_db(): Promise<IDBPDatabase<VitaKOfflineDB>> {
  if (!db_instance) {
    return await init_offline_database();
  }
  return db_instance;
}

export async function clear_offline_database(): Promise<void> {
  const db = await get_offline_db();
  
  const stores: Array<keyof VitaKOfflineDB> = [
    'meal_logs',
    'foods',
    'user_settings',
    'meal_presets',
    'sync_queue'
  ];
  
  const tx = db.transaction(stores, 'readwrite');
  
  await Promise.all([
    tx.objectStore('meal_logs').clear(),
    tx.objectStore('foods').clear(),
    tx.objectStore('user_settings').clear(),
    tx.objectStore('meal_presets').clear(),
    tx.objectStore('sync_queue').clear(),
  ]);
  
  await tx.done;
}

export function close_offline_database(): void {
  if (db_instance) {
    db_instance.close();
    db_instance = null;
  }
}