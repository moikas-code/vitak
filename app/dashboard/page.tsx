"use client";

import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditDisplay } from "@/components/dashboard/credit-display";
import { RecentMeals } from "@/components/dashboard/recent-meals";
import { QuickAdd } from "@/components/dashboard/quick-add";
import { MealPresets } from "@/components/dashboard/meal-presets";
import { api } from "@/lib/trpc/provider";
import { track_dashboard_event } from "@/lib/analytics";
import { useOfflineMealLogs, useOfflineInit, useConnectionStatus, useTokenRefresh } from "@/lib/offline/hooks";
import { WifiOff, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SyncManager } from "@/lib/offline/sync-manager";

export default function DashboardPage() {
  const { data: balances, error: balancesError } = api.credit.getAllBalances.useQuery(undefined, {
    retry: 2,
    retryDelay: 1000,
  });
  useOfflineInit(); // Initialize offline services
  useTokenRefresh(); // Keep tokens fresh for sync
  const { meal_logs: todayMeals, is_loading } = useOfflineMealLogs();
  const { is_online, is_syncing, unsynced_count } = useConnectionStatus();

  useEffect(() => {
    track_dashboard_event('dashboard');
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Track your Vitamin K intake and stay within your limits
        </p>
        <div className="flex items-center justify-between mt-2">
          {!is_online ? (
            <div className="flex items-center gap-2 text-amber-600">
              <WifiOff className="h-4 w-4" />
              <span className="text-sm">Offline mode{unsynced_count > 0 && ` • ${unsynced_count} changes pending sync`}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-green-600">
              <RefreshCw className="h-4 w-4" />
              <span className="text-sm">Online{unsynced_count > 0 && ` • ${unsynced_count} changes to sync`}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            {unsynced_count > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  try {
                    await SyncManager.getInstance().forceSync();
                  } catch (error) {
                    console.error('Manual sync failed:', error);
                  }
                }}
                className="h-7 text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Sync Now
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                window.location.reload();
              }}
              className="h-7 text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh
            </Button>
          </div>
        </div>
        {is_syncing && (
          <div className="flex items-center gap-2 mt-2 text-blue-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Syncing changes...</span>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {balancesError ? (
          <div className="col-span-full p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-800 text-sm">
              Unable to load credit balances. This won&apos;t affect offline functionality.
            </p>
          </div>
        ) : balances ? (
          <>
            <CreditDisplay
              title="Daily Credits"
              current={balances.daily.credits_used}
              limit={balances.daily.credits_limit}
              period="daily"
            />
            <CreditDisplay
              title="Weekly Credits"
              current={balances.weekly.credits_used}
              limit={balances.weekly.credits_limit}
              period="weekly"
            />
            <CreditDisplay
              title="Monthly Credits"
              current={balances.monthly.credits_used}
              limit={balances.monthly.credits_limit}
              period="monthly"
            />
          </>
        ) : (
          <div className="col-span-full flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Loading credits...</span>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Meal Presets</CardTitle>
          <CardDescription>
            Your saved meal combinations for quick logging
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MealPresets />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Add Meal</CardTitle>
            <CardDescription>
              Log your food quickly by searching our database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <QuickAdd />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Meals</CardTitle>
            <CardDescription>
              Your logged meals for today
            </CardDescription>
          </CardHeader>
          <CardContent>
            {is_loading && !todayMeals ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <RecentMeals meals={todayMeals || []} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}