"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/trpc/provider";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { track_dashboard_event } from "@/lib/analytics";
import type { MealLogWithFood } from "@/lib/types";

export default function HistoryPage() {
  const [dateRange, setDateRange] = useState(() => {
    const end_date = new Date();
    const start_date = new Date();
    start_date.setDate(start_date.getDate() - 7);
    return { start_date: start_date.toISOString(), end_date: end_date.toISOString() };
  });

  useEffect(() => {
    track_dashboard_event('history');
  }, []);

  const { data: mealLogs } = api.mealLog.getByDateRange.useQuery({
    ...dateRange,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  const { data: balances } = api.credit.getAllBalances.useQuery();

  const groupedByDate = mealLogs?.reduce((acc: Record<string, MealLogWithFood[]>, log: MealLogWithFood) => {
    const date = format(new Date(log.logged_at), "yyyy-MM-dd");
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(log);
    return acc;
  }, {} as Record<string, MealLogWithFood[]>);

  const weeklyUsed = balances?.weekly?.credits_used ?? 0;
  const weeklyLimit = balances?.weekly?.credits_limit ?? 700;
  const monthlyUsed = balances?.monthly?.credits_used ?? 0;
  const monthlyLimit = balances?.monthly?.credits_limit ?? 3000;
  const monthlyRemaining = monthlyLimit - monthlyUsed;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">History</h1>
          <p className="text-gray-600 mt-1">
            View your Vitamin K consumption history
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Date Range</CardTitle>
          <CardDescription>
            Showing data from {format(new Date(dateRange.start_date), "MMM d, yyyy")} to{" "}
            {format(new Date(dateRange.end_date), "MMM d, yyyy")}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              const end_date = new Date();
              const start_date = new Date();
              start_date.setDate(start_date.getDate() - 7);
              setDateRange({ start_date: start_date.toISOString(), end_date: end_date.toISOString() });
            }}
          >
            Last 7 days
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const end_date = new Date();
              const start_date = new Date();
              start_date.setDate(start_date.getDate() - 30);
              setDateRange({ start_date: start_date.toISOString(), end_date: end_date.toISOString() });
            }}
          >
            Last 30 days
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const end_date = new Date();
              const start_date = new Date();
              start_date.setMonth(start_date.getMonth() - 3);
              setDateRange({ start_date: start_date.toISOString(), end_date: end_date.toISOString() });
            }}
          >
            Last 3 months
          </Button>
        </CardContent>
      </Card>

      {balances && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Weekly Average</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {(weeklyUsed / 7).toFixed(0)} mcg/day
              </p>
              <p className="text-sm text-muted-foreground">
                {weeklyLimit > 0 ? `${((weeklyUsed / weeklyLimit) * 100).toFixed(0)}% of weekly limit` : '0% of weekly limit'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Monthly Total</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {monthlyUsed.toFixed(0)} mcg
              </p>
              <p className="text-sm text-muted-foreground">
                {monthlyRemaining > 0 
                  ? `${monthlyRemaining.toFixed(0)} mcg remaining`
                  : `${Math.abs(monthlyRemaining).toFixed(0)} mcg over`
                }
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Consistency</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">Good</p>
              <p className="text-sm text-muted-foreground">
                Staying within limits
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Daily Breakdown</CardTitle>
          <CardDescription>
            Your Vitamin K consumption by day
          </CardDescription>
        </CardHeader>
        <CardContent>
          {groupedByDate && Object.keys(groupedByDate).length > 0 ? (
            <div className="space-y-4">
              {(Object.entries(groupedByDate) as [string, MealLogWithFood[]][])
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([date, logs]) => {
                  const dayTotal = logs.reduce(
                    (sum: number, log: MealLogWithFood) => sum + (log.vitamin_k_consumed_mcg ?? 0),
                    0
                  );
                  return (
                    <div key={date} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">
                          {format(new Date(date), "EEEE, MMM d")}
                        </h4>
                        <span className="text-sm font-medium">
                          {dayTotal.toFixed(0)} mcg total
                        </span>
                      </div>
                      <div className="space-y-2">
                        {logs.map((log: MealLogWithFood) => (
                          <div
                            key={log.id}
                            className="flex justify-between text-sm text-muted-foreground"
                          >
                            <span>{log.food?.name || "Unknown Food"}</span>
                            <span>
                              {log.portion_size_g ?? 0}g
                              {log.food?.common_portion_name && log.food?.common_portion_size_g ? (
                                <span className="text-xs">
                                  {" "}({((log.portion_size_g ?? 0) / log.food.common_portion_size_g).toFixed(1)} × {log.food.common_portion_name})
                                </span>
                              ) : null}
                              {" "}• {(log.vitamin_k_consumed_mcg ?? 0).toFixed(1)} mcg
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No meal data found for the selected date range
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}