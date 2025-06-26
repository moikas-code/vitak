"use client";

import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditDisplay } from "@/components/dashboard/credit-display";
import { RecentMeals } from "@/components/dashboard/recent-meals";
import { QuickAdd } from "@/components/dashboard/quick-add";
import { api } from "@/lib/trpc/provider";
import { track_dashboard_event } from "@/lib/analytics";

export default function DashboardPage() {
  const { data: balances } = api.credit.getAllBalances.useQuery();
  const { data: todayMeals } = api.mealLog.getToday.useQuery();

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
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {balances && (
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
        )}
      </div>

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
            <RecentMeals meals={todayMeals || []} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}