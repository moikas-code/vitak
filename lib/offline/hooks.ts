import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { api } from '@/lib/trpc/provider';
import { OfflineStorageService } from './storage-service';
import { SyncManager } from './sync-manager';
import { generate_encryption_key, store_encryption_key } from './encryption';
import { init_offline_database } from './database';
import type { MealLog, Food, UserSettings, MealLogWithFood } from '@/lib/types';

// Initialize offline services when user is logged in
export function useOfflineInit() {
  const { user, isLoaded } = useUser();
  const [is_initialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    if (isLoaded && user) {
      initializeOfflineServices(user.id).then(() => {
        setIsInitialized(true);
      });
    }
  }, [isLoaded, user]);
  
  return is_initialized;
}

async function initializeOfflineServices(user_id: string) {
  try {
    // Generate and store encryption key
    const encryption_key = generate_encryption_key(user_id);
    store_encryption_key(encryption_key);
    
    // Initialize database
    await init_offline_database();
    
    // Start sync manager
    SyncManager.getInstance();
    
  } catch (error) {
    console.error('Failed to initialize offline services:', error);
  }
}

// Offline-aware meal log hooks
export function useOfflineMealLogs() {
  const { user } = useUser();
  const [meal_logs, setMealLogs] = useState<MealLogWithFood[]>([]);
  const [is_loading, setIsLoading] = useState(true);
  const storage = OfflineStorageService.getInstance();
  
  // Try to get from server first, fallback to local
  const server_query = api.mealLog.getToday.useQuery(undefined, {
    enabled: typeof window !== 'undefined' && navigator.onLine && !!user,
    retry: false,
  });
  
  useEffect(() => {
    if (user) {
      loadMealLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, server_query.data]);
  
  async function loadMealLogs() {
    if (!user) return;
    
    try {
      if (typeof window !== 'undefined' && navigator.onLine && server_query.data) {
        setMealLogs(server_query.data);
      } else {
        // Load from local storage
        const local_logs = await storage.getMealLogs(user.id);
        
        // Enrich with food data
        const cached_foods = await storage.getCachedFoods();
        const enriched_logs = local_logs.map(log => {
          const food = cached_foods.find(f => f.id === log.food_id);
          return {
            ...log,
            food: food || null
          } as MealLogWithFood;
        });
        
        setMealLogs(enriched_logs);
      }
    } catch (error) {
      console.error('Failed to load meal logs:', error);
    } finally {
      setIsLoading(false);
    }
  }
  
  const addMealLog = async (food_id: string, portion_size_g: number) => {
    if (!user) return;
    
    // Calculate vitamin K consumed
    const food = await storage.getCachedFoods().then(foods => 
      foods.find(f => f.id === food_id)
    );
    
    if (!food) {
      throw new Error('Food not found');
    }
    
    const vitamin_k_consumed_mcg = (food.vitamin_k_mcg_per_100g * portion_size_g) / 100;
    
    const new_log: MealLog = {
      id: `local_${Date.now()}_${Math.random()}`,
      user_id: user.id,
      food_id,
      portion_size_g,
      vitamin_k_consumed_mcg,
      logged_at: new Date(),
      created_at: new Date(),
    };
    
    // Add to local storage
    await storage.addMealLog(new_log, user.id);
    
    // Update UI immediately with food data
    const enriched_log: MealLogWithFood = {
      ...new_log,
      food
    };
    setMealLogs(prev => [enriched_log, ...prev]);
    
    // Try to sync if online
    if (typeof window !== 'undefined' && navigator.onLine) {
      SyncManager.getInstance().forceSync();
    }
  };
  
  const deleteMealLog = async (id: string) => {
    await storage.deleteMealLog(id);
    setMealLogs(prev => prev.filter(log => log.id !== id));
    
    if (typeof window !== 'undefined' && navigator.onLine) {
      SyncManager.getInstance().forceSync();
    }
  };
  
  return {
    meal_logs,
    is_loading,
    addMealLog,
    deleteMealLog,
    refetch: loadMealLogs,
  };
}

// Offline-aware food search
export function useOfflineFoodSearch(search: string) {
  const [foods, setFoods] = useState<Food[]>([]);
  const [is_loading, setIsLoading] = useState(false);
  const storage = OfflineStorageService.getInstance();
  
  // Try server first
  const server_query = api.food.search.useQuery(
    { query: search },
    {
      enabled: typeof window !== 'undefined' && navigator.onLine && search.length > 0,
      retry: false,
    }
  );
  
  useEffect(() => {
    loadFoods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, server_query.data]);
  
  async function loadFoods() {
    if (!search) {
      setFoods([]);
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (typeof window !== 'undefined' && navigator.onLine && server_query.data) {
        setFoods(server_query.data);
        
        // Cache the results
        for (const food of server_query.data) {
          await storage.cacheFood(food);
        }
      } else {
        // Search in cached foods
        const cached = await storage.getCachedFoods(search);
        setFoods(cached);
      }
    } catch (error) {
      console.error('Failed to load foods:', error);
    } finally {
      setIsLoading(false);
    }
  }
  
  return {
    foods,
    is_loading: is_loading || server_query.isLoading,
  };
}

// Offline-aware user settings
export function useOfflineUserSettings() {
  const { user } = useUser();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [is_loading, setIsLoading] = useState(true);
  const storage = OfflineStorageService.getInstance();
  
  const server_query = api.user.getSettings.useQuery(undefined, {
    enabled: typeof window !== 'undefined' && navigator.onLine && !!user,
    retry: false,
  });
  
  useEffect(() => {
    if (user) {
      loadSettings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, server_query.data]);
  
  async function loadSettings() {
    if (!user) return;
    
    try {
      if (typeof window !== 'undefined' && navigator.onLine && server_query.data) {
        setSettings(server_query.data);
        
        // Cache the settings
        await storage.saveUserSettings(server_query.data);
      } else {
        // Load from local storage
        const local_settings = await storage.getUserSettings(user.id);
        setSettings(local_settings);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  }
  
  const updateSettings = async (updates: Partial<UserSettings>) => {
    if (!user || !settings) return;
    
    const updated_settings = { ...settings, ...updates };
    
    // Update local storage
    await storage.saveUserSettings(updated_settings);
    
    // Update UI
    setSettings(updated_settings);
    
    // Sync if online
    if (typeof window !== 'undefined' && navigator.onLine) {
      SyncManager.getInstance().forceSync();
    }
  };
  
  return {
    settings,
    is_loading,
    updateSettings,
  };
}

// Connection status hook
export function useConnectionStatus() {
  const [is_online, setIsOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : true);
  const [sync_status, setSyncStatus] = useState({
    is_syncing: false,
    unsynced_count: 0,
  });
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check sync status periodically
    const interval = setInterval(async () => {
      const status = await SyncManager.getInstance().getSyncStatus();
      setSyncStatus({
        is_syncing: status.is_syncing,
        unsynced_count: status.unsynced_count,
      });
    }, 5000);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);
  
  return {
    is_online,
    is_syncing: sync_status.is_syncing,
    unsynced_count: sync_status.unsynced_count,
  };
}