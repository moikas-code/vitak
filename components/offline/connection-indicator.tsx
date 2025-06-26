"use client";

import { useConnectionStatus } from '@/lib/offline/hooks';
import { WifiOff, Wifi, Loader2, Cloud } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export function ConnectionIndicator() {
  const { is_online, is_syncing, unsynced_count } = useConnectionStatus();
  
  if (is_online && unsynced_count === 0 && !is_syncing) {
    // Everything is synced and online - don't show anything
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg transition-all",
        is_online ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"
      )}>
        {is_online ? (
          <>
            {is_syncing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">Syncing...</span>
              </>
            ) : unsynced_count > 0 ? (
              <>
                <Cloud className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {unsynced_count} item{unsynced_count !== 1 ? 's' : ''} pending
                </span>
              </>
            ) : (
              <>
                <Wifi className="h-4 w-4" />
                <span className="text-sm font-medium">Online</span>
              </>
            )}
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            <span className="text-sm font-medium">Offline Mode</span>
          </>
        )}
      </div>
      
      {!is_online && (
        <div className="mt-2 p-2 bg-white rounded-lg shadow-lg max-w-xs">
          <p className="text-xs text-gray-600">
            Your changes will be saved locally and synced when you&apos;re back online.
          </p>
        </div>
      )}
    </div>
  );
}