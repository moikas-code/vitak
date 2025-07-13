import { useEffect, useState } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { api } from '@/lib/trpc/provider';
import { OfflineStorageService } from './storage-service';
import { SyncManager } from './sync-manager';
import { OfflineInitManager } from './init-manager';
import { TokenStorageService } from './token-storage';
import { createLogger } from '@/lib/logger';
import type { MealLog, Food, UserSettings, MealLogWithFood, MealPreset, MealPresetWithFood } from '@/lib/types';

const logger = createLogger('offline-hooks');

// Initialize offline services when user is logged in
export function useOfflineInit() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [is_initialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    if (isLoaded && user) {
      OfflineInitManager.getInstance().initialize(user.id, getToken).then((result) => {
        setIsInitialized(result);
      });
    }
  }, [isLoaded, user, getToken]);
  
  return is_initialized;
}

// Offline-aware meal log hooks
export function useOfflineMealLogs() {
  const { user } = useUser();
  const [meal_logs, setMealLogs] = useState<MealLogWithFood[]>([]);
  const [is_loading, setIsLoading] = useState(true);
  const storage = OfflineStorageService.getInstance();
  
  // Try to get from server first, fallback to local
  const server_query = api.mealLog.getToday.useQuery(undefined, {
    enabled: !!user,
    retry: false,
    staleTime: 0, // Always fetch fresh data when online
    refetchOnWindowFocus: true,
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
      // Always load local data first
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
      
      // Merge with server data if available
      if (server_query.data && !server_query.isError) {
        // Merge local and server data, prioritizing local unsynced changes
        const merged_logs = [...enriched_logs];
        
        // Add any server logs that aren't in local storage
        for (const server_log of server_query.data) {
          const local_exists = enriched_logs.some(local => 
            local.id === server_log.id || 
            // Check if a local log was synced and got a new server ID
            (local.id.startsWith('local_') && local.food_id === server_log.food_id && 
             Math.abs(new Date(local.logged_at).getTime() - new Date(server_log.logged_at).getTime()) < 1000)
          );
          
          if (!local_exists) {
            merged_logs.push(server_log);
          }
        }
        
        // Sort by logged_at date
        merged_logs.sort((a, b) => 
          new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime()
        );
        
        setMealLogs(merged_logs);
      } else {
        // No server data, use local data only
        setMealLogs(enriched_logs);
      }
    } catch (error) {
      logger.error('Failed to load meal logs', error);
      // If local storage fails, fall back to server data if available
      if (server_query.data && !server_query.isError) {
        setMealLogs(server_query.data);
      }
    } finally {
      setIsLoading(false);
    }
  }
  
  const addMealLog = async (food_id: string, portion_size_g: number) => {
    if (!user) return;
    
    logger.info('Adding meal log', { food_id, portion_size_g });
    
    // Calculate vitamin K consumed
    const food = await storage.getCachedFoods().then(foods => 
      foods.find(f => f.id === food_id)
    );
    
    if (!food) {
      logger.error('Food not found', undefined, { food_id });
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
    
    logger.info('Created new meal log', { id: new_log.id, food_id: new_log.food_id });
    
    // Add to local storage
    await storage.addMealLog(new_log, user.id);
    logger.info('Saved meal log to local storage');
    
    // Update UI immediately with food data
    const enriched_log: MealLogWithFood = {
      ...new_log,
      food
    };
    setMealLogs(prev => [enriched_log, ...prev]);
    logger.info('Updated UI with new log');
    
    // Try to sync if online
    const is_online = typeof window !== 'undefined' && navigator.onLine;
    logger.info('Online status check', { is_online });
    
    if (is_online) {
      logger.info('Triggering sync...');
      try {
        await SyncManager.getInstance().forceSync();
        logger.info('Sync completed');
      } catch (error) {
        logger.error('Sync failed', error);
      }
    } else {
      logger.info('Offline - sync will happen when connection is restored');
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
      enabled: search.length > 0,
      retry: false,
      staleTime: 0,
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
      // Always try to use server data if available
      if (server_query.data && !server_query.isError) {
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
      logger.error('Failed to load foods', error);
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
    enabled: !!user,
    retry: false,
    staleTime: 0,
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
      // Always try to use server data if available
      if (server_query.data && !server_query.isError) {
        setSettings(server_query.data);
        
        // Cache the settings
        await storage.saveUserSettings(server_query.data);
      } else {
        // Load from local storage
        const local_settings = await storage.getUserSettings(user.id);
        setSettings(local_settings);
      }
    } catch (error) {
      logger.error('Failed to load settings', error);
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

// Connection status hook with real connectivity check
export function useConnectionStatus() {
  const [is_online, setIsOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : true);
  const [has_internet, setHasInternet] = useState(true);
  const [sync_status, setSyncStatus] = useState({
    is_syncing: false,
    unsynced_count: 0,
  });
  
  // Test actual internet connectivity
  const testConnectivity = async () => {
    if (!navigator.onLine) {
      setIsOnline(false);
      setHasInternet(false);
      return false;
    }
    
    try {
      // Try to fetch a small resource with a timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      // Use a simple health check endpoint or the food categories which is lightweight
      const response = await fetch('/api/trpc/food.getCategories', {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      clearTimeout(timeoutId);
      const connected = response.ok || response.status === 401 || response.status === 403;
      setHasInternet(connected);
      return connected;
    } catch (error) {
      console.debug('[Connection] Connectivity test failed:', error);
      setHasInternet(false);
      return false;
    }
  };
  
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      // Test actual connectivity when browser says we're online
      const connected = await testConnectivity();
      if (connected) {
        // Trigger immediate sync when truly online
        SyncManager.getInstance().forceSync();
      }
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setHasInternet(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial connectivity test
    testConnectivity();
    
    // Check sync status and connectivity periodically
    const interval = setInterval(async () => {
      const status = await SyncManager.getInstance().getSyncStatus();
      setSyncStatus({
        is_syncing: status.is_syncing,
        unsynced_count: status.unsynced_count,
      });
      
      // Also test connectivity periodically
      if (navigator.onLine) {
        await testConnectivity();
      }
    }, 5000);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);
  
  return {
    is_online: is_online && has_internet,
    is_browser_online: is_online,
    has_internet,
    is_syncing: sync_status.is_syncing,
    unsynced_count: sync_status.unsynced_count,
  };
}

// Token refresh hook - ensures tokens stay fresh for sync
export function useTokenRefresh() {
  const { getToken } = useAuth();
  const { isSignedIn } = useUser();
  
  useEffect(() => {
    if (!isSignedIn) return;
    
    const refreshToken = async () => {
      try {
        const token = await getToken();
        if (token) {
          await TokenStorageService.getInstance().storeToken(token);
        }
      } catch (error) {
        logger.warn('Failed to refresh token', { error });
      }
    };
    
    // Refresh token immediately
    refreshToken();
    
    // Refresh token every 30 minutes
    const interval = setInterval(refreshToken, 30 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [getToken, isSignedIn]);
}

// Offline-aware meal presets hook
export function useOfflineMealPresets() {
  const { user } = useUser();
  const [meal_presets, setMealPresets] = useState<MealPresetWithFood[]>([]);
  const [is_loading, setIsLoading] = useState(true);
  const storage = OfflineStorageService.getInstance();
  
  // Try to get from server first, fallback to local
  const server_query = api.mealPreset.getAll.useQuery(undefined, {
    enabled: !!user,
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
  
  useEffect(() => {
    if (user) {
      loadMealPresets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, server_query.data]);
  
  async function loadMealPresets() {
    if (!user) return;
    
    try {
      // Always try to use server data if available
      if (server_query.data && !server_query.isError) {
        setMealPresets(server_query.data);
        
        // Cache the presets for offline use
        for (const preset of server_query.data) {
          await storage.saveMealPreset(preset);
        }
        setIsLoading(false);
        return;
      }
      
      // Only use local storage if server query failed or no data yet
      const local_presets = await storage.getMealPresets(user.id);
      
      // Enrich with food data
      const cached_foods = await storage.getCachedFoods();
      const enriched_presets = local_presets.map(preset => {
        const food = cached_foods.find(f => f.id === preset.food_id);
        return {
          ...preset,
          food: food || null
        } as MealPresetWithFood;
      });
      
      setMealPresets(enriched_presets);
    } catch (error) {
      logger.error('Failed to load meal presets', error);
    } finally {
      setIsLoading(false);
    }
  }
  
  const addMealPreset = async (preset: Omit<MealPreset, 'id' | 'created_at' | 'updated_at' | 'usage_count' | 'user_id'>) => {
    if (!user) return;
    
    const new_preset: MealPreset = {
      ...preset,
      id: `local_${Date.now()}_${Math.random()}`,
      user_id: user.id,
      usage_count: 0,
      created_at: new Date(),
      updated_at: new Date(),
    };
    
    // Add to local storage
    await storage.saveMealPreset(new_preset);
    
    // Update UI immediately with food data
    const foods = await storage.getCachedFoods();
    const food = foods.find(f => f.id === new_preset.food_id);
    const enriched_preset: MealPresetWithFood = {
      ...new_preset,
      food: food || null
    };
    setMealPresets(prev => [...prev, enriched_preset]);
    
    // Try to sync if online
    if (typeof window !== 'undefined' && navigator.onLine) {
      SyncManager.getInstance().forceSync();
    }
  };
  
  const deleteMealPreset = async (id: string) => {
    await storage.deleteMealPreset(id);
    setMealPresets(prev => prev.filter(preset => preset.id !== id));
    
    if (typeof window !== 'undefined' && navigator.onLine) {
      SyncManager.getInstance().forceSync();
    }
  };
  
  const logFromPreset = async (preset_id: string) => {
    const preset = meal_presets.find(p => p.id === preset_id);
    if (!preset || !user) return;
    
    // Get the food details
    const foods = await storage.getCachedFoods();
    const food = foods.find(f => f.id === preset.food_id);
    
    if (!food) {
      throw new Error('Food not found in cache');
    }
    
    // Calculate vitamin K
    const vitamin_k_consumed_mcg = (food.vitamin_k_mcg_per_100g * preset.portion_size_g) / 100;
    
    // Create meal log
    const new_log: MealLog = {
      id: `local_${Date.now()}_${Math.random()}`,
      user_id: user.id,
      food_id: preset.food_id,
      portion_size_g: preset.portion_size_g,
      vitamin_k_consumed_mcg,
      logged_at: new Date(),
      created_at: new Date(),
    };
    
    // Add meal log
    await storage.addMealLog(new_log, user.id);
    
    // Update preset usage count locally
    const updated_preset = { ...preset, usage_count: preset.usage_count + 1 };
    await storage.saveMealPreset(updated_preset);
    setMealPresets(prev => prev.map(p => p.id === preset_id ? updated_preset : p));
    
    // Sync if online
    if (typeof window !== 'undefined' && navigator.onLine) {
      SyncManager.getInstance().forceSync();
    }
    
    return new_log;
  };
  
  return {
    meal_presets,
    is_loading,
    addMealPreset,
    deleteMealPreset,
    logFromPreset,
    refetch: loadMealPresets,
  };
}