import { OfflineStorageService } from './storage-service';
import { api } from '@/lib/trpc/provider';

/**
 * Pre-populates the food cache with common foods for offline use
 */
export async function populateFoodCache() {
  const storage = OfflineStorageService.getInstance();
  
  try {
    console.log('[FoodCache] Starting food cache population...');
    
    // Try to fetch common foods from the server
    const response = await fetch('/api/trpc/food.getCommonFoods', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      const foods = data?.result?.data?.json || [];
      
      console.log(`[FoodCache] Caching ${foods.length} common foods`);
      
      // Cache each food
      for (const food of foods) {
        await storage.cacheFood(food);
      }
      
      console.log('[FoodCache] Food cache populated successfully');
      return true;
    } else {
      console.warn('[FoodCache] Failed to fetch common foods:', response.status);
      return false;
    }
  } catch (error) {
    console.error('[FoodCache] Error populating food cache:', error);
    return false;
  }
}

/**
 * Hook to ensure food cache is populated
 */
export function useFoodCachePopulation() {
  const { data: common_foods } = api.food.getCommonFoods.useQuery(undefined, {
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    refetchOnWindowFocus: false,
  });
  
  useEffect(() => {
    if (common_foods && common_foods.length > 0) {
      const storage = OfflineStorageService.getInstance();
      
      // Cache foods in the background
      Promise.all(
        common_foods.map(food => storage.cacheFood(food))
      ).then(() => {
        console.log('[FoodCache] Cached', common_foods.length, 'common foods');
      }).catch(error => {
        console.error('[FoodCache] Error caching foods:', error);
      });
    }
  }, [common_foods]);
}

// Import for useEffect
import { useEffect } from 'react';