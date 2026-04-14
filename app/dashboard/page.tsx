"use client";

export const dynamic = 'force-dynamic';

import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditDisplay } from "@/components/dashboard/credit-display";
import { RecentMeals } from "@/components/dashboard/recent-meals";
import { QuickAdd } from "@/components/dashboard/quick-add";
import { MealPresets } from "@/components/dashboard/meal-presets";
import { api } from "@/lib/trpc/provider";
import { track_dashboard_event } from "@/lib/analytics";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { data: balances, error: balancesError } = api.credit.getAllBalances.useQuery(undefined, {
    retry: 2,
    retryDelay: 1000,
  });
  const { data: todayMeals, isLoading: mealsLoading } = api.mealLog.getToday.useQuery();

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
        <div className="flex items-center gap-2 mt-2">
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {balancesError ? (
          <div className="col-span-full p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-800 text-sm">
              Unable to load credit balances. Please try refreshing.
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
            {mealsLoading && !todayMeals ? (
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