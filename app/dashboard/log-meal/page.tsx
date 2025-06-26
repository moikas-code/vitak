"use client";

import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QuickAdd } from "@/components/dashboard/quick-add";
import { RecentMeals } from "@/components/dashboard/recent-meals";
import { api } from "@/lib/trpc/provider";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { track_dashboard_event } from "@/lib/analytics";

export default function LogMealPage() {
  const { data: todayMeals } = api.mealLog.getToday.useQuery();
  const { data: balances } = api.credit.getAllBalances.useQuery();

  useEffect(() => {
    track_dashboard_event('log_meal');
  }, []);

  const todayTotal = todayMeals?.reduce(
    (sum, meal) => sum + meal.vitamin_k_consumed_mcg,
    0
  ) || 0;

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
                  {(balances.daily.credits_limit - todayTotal).toFixed(0)}
                </p>
                <p className="text-sm text-muted-foreground">mcg remaining</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {((todayTotal / balances.daily.credits_limit) * 100).toFixed(0)}%
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
              Foods you&apos;ve logged today
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