"use client";

import { Suspense, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QuickAdd } from "@/components/dashboard/quick-add";
import { RecentMeals } from "@/components/dashboard/recent-meals";
import { api } from "@/lib/trpc/provider";
import { ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { track_dashboard_event } from "@/lib/analytics";

function LogMealContent() {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const todayQuery = api.mealLog.getToday.useQuery({ timezone });
  const balancesQuery = api.credit.getAllBalances.useQuery();

  const todayMeals = todayQuery.data;
  const balances = balancesQuery.data;

  useEffect(() => {
    track_dashboard_event('log_meal');
  }, []);

  const todayTotal = todayMeals?.reduce(
    (sum: number, meal: { vitamin_k_consumed_mcg: number }) => sum + (meal.vitamin_k_consumed_mcg ?? 0),
    0
  ) ?? 0;

  const dailyLimit = balances?.daily?.credits_limit ?? 100;
  const remaining = dailyLimit - todayTotal;
  const percentage = dailyLimit > 0 ? (todayTotal / dailyLimit) * 100 : 0;

  return (
    <div className="space-y-6">
      {todayQuery.error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>Error loading meals: {todayQuery.error.message}</span>
        </div>
      )}

      {balances && (
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">Today&apos;s Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">
                  {todayTotal.toFixed(0)}
                </p>
                <p className="text-sm text-muted-foreground">mcg consumed</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {remaining.toFixed(0)}
                </p>
                <p className="text-sm text-muted-foreground">mcg remaining</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {percentage.toFixed(0)}%
                </p>
                <p className="text-sm text-muted-foreground">of daily limit</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Add Food</CardTitle>
            <CardDescription>
              Search our database to log your meals
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
              {todayQuery.isLoading ? "Loading meals..." :
               todayMeals ? `${todayMeals.length} meal${todayMeals.length !== 1 ? 's' : ''} logged today` :
               "Foods you&apos;ve logged today"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecentMeals meals={todayMeals || []} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LogMealPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Log Meal</h1>
          <p className="text-gray-600 mt-1">
            Add foods to track your Vitamin K intake
          </p>
        </div>
      </div>

      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      }>
        <LogMealContent />
      </Suspense>
    </div>
  );
}