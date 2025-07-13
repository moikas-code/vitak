import { OfflineStorageService } from './storage-service';
import { api } from '@/lib/trpc/provider';
import { createLogger } from '@/lib/logger';
import { useEffect } from 'react';

const logger = createLogger('food-cache');

/**
 * Pre-populates the food cache with common foods for offline use
 */
export async function populateFoodCache() {
  const storage = OfflineStorageService.getInstance();
  
  try {
    logger.info('Starting food cache population...');
    
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
      
      logger.info('Caching common foods', { count: foods.length });
      
      // Cache each food
      for (const food of foods) {
        await storage.cacheFood(food);
      }
      
      logger.info('Food cache populated successfully');
      return true;
    } else {
      logger.warn('Failed to fetch common foods', { status: response.status });
      return false;
    }
  } catch (error) {
    logger.error('Error populating food cache', error);
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
        logger.info('Cached common foods', { count: common_foods.length });
      }).catch(error => {
        logger.error('Error caching foods', error);
      });
    }
  }, [common_foods]);
}