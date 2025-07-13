import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { MealLog, Food, UserSettings, MealPreset } from '@/lib/types';
import { createLogger } from '@/lib/logger';

const logger = createLogger('offline-db');

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
  
  auth_tokens: {
    key: string;
    value: {
      id: string;
      token?: string; // Plain token for v1
      encrypted_token?: string; // Encrypted token for v2
      salt?: string; // Salt for v2
      iv?: string; // IV for v2
      stored_at: Date;
      expires_at: Date;
      version?: number; // Version to track migration
    };
  };
}

const DB_NAME = 'vitak-offline-db';
const DB_VERSION = 2;

let db_instance: IDBPDatabase<VitaKOfflineDB> | null = null;
let db_init_promise: Promise<IDBPDatabase<VitaKOfflineDB>> | null = null;

export async function init_offline_database(): Promise<IDBPDatabase<VitaKOfflineDB>> {
  if (db_instance) return db_instance;
  
  // If initialization is already in progress, wait for it
  if (db_init_promise) {
    logger.info('[Database] Initialization already in progress, waiting...');
    return db_init_promise;
  }
  
  // Start new initialization
  db_init_promise = initializeDatabase();
  
  try {
    db_instance = await db_init_promise;
    return db_instance;
  } catch (error) {
    db_init_promise = null; // Reset on failure so it can be retried
    throw error;
  }
}

async function initializeDatabase(): Promise<IDBPDatabase<VitaKOfflineDB>> {
  try {
    logger.info('[Database] Starting database initialization...');
    
    const db = await openDB<VitaKOfflineDB>(DB_NAME, DB_VERSION, {
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
        
        // Create auth_tokens store for storing authentication tokens
        if (!db.objectStoreNames.contains('auth_tokens')) {
          db.createObjectStore('auth_tokens', { keyPath: 'id' });
        }
      },
      blocked(currentVersion, blockedVersion, event) {
        logger.warn('Database blocked by another connection', { currentVersion, blockedVersion });
        
        // Instead of throwing immediately, wait a bit and try to close other connections
        const target = event.target as IDBOpenDBRequest;
        
        // Create a promise that resolves when the block is cleared
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Database remains blocked after timeout. Please close other tabs and refresh.'));
          }, 10000); // 10 second timeout
          
          target.addEventListener('success', () => {
            logger.info('[Database] Block cleared, database opened successfully');
            clearTimeout(timeout);
            resolve(target.result);
          });
          
          target.addEventListener('error', () => {
            clearTimeout(timeout);
            reject(new Error('Database blocked and failed to open'));
          });
        });
      },
      blocking(currentVersion, blockedVersion, _event) {
        logger.warn('This connection is blocking another', { currentVersion, blockedVersion });
        // Close the database to unblock other connections
        if (db_instance) {
          logger.info('[Database] Closing database to unblock other connections');
          db_instance.close();
          db_instance = null;
        }
      },
      terminated() {
        logger.error('[Database] Database connection terminated unexpectedly');
        db_instance = null;
        db_init_promise = null;
        throw new Error('Database connection was terminated. Please refresh the page.');
      },
    });
    
    logger.info('[Database] Successfully initialized offline database');
    return db;
  } catch (error) {
    logger.error('[Database] Failed to initialize offline database:', error);
    db_instance = null;
    db_init_promise = null;
    
    if (error instanceof Error) {
      if (error.name === 'SecurityError') {
        throw new Error('Cannot access offline storage in private/incognito mode. Please use normal browsing mode.');
      } else if (error.name === 'QuotaExceededError') {
        throw new Error('Storage quota exceeded. Please clear browser data and try again.');
      } else if (error.name === 'InvalidStateError') {
        throw new Error('Database is in an invalid state. Please refresh the page.');
      }
    }
    
    throw error;
  }
}

export async function get_offline_db(): Promise<IDBPDatabase<VitaKOfflineDB>> {
  if (!db_instance) {
    return await init_offline_database();
  }
  return db_instance;
}

export async function clear_offline_database(): Promise<void> {
  const db = await get_offline_db();
  
  const tx = db.transaction([
    'meal_logs',
    'foods',
    'user_settings',
    'meal_presets',
    'sync_queue',
    'auth_tokens'
  ] as const, 'readwrite');
  
  await Promise.all([
    tx.objectStore('meal_logs').clear(),
    tx.objectStore('foods').clear(),
    tx.objectStore('user_settings').clear(),
    tx.objectStore('meal_presets').clear(),
    tx.objectStore('sync_queue').clear(),
    tx.objectStore('auth_tokens').clear(),
  ]);
  
  await tx.done;
}

export function close_offline_database(): void {
  if (db_instance) {
    db_instance.close();
    db_instance = null;
  }
}