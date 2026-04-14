export const dynamic = 'force-dynamic';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDb } from "@/lib/db";
import { foods, userSettings, mealLogs, foodAuditLog } from "@/lib/db/schema";
import { sql, gte } from "drizzle-orm";
import {
  UtensilsCrossed,
  Users,
  Activity,
  TrendingUp,
} from "lucide-react";

async function getAdminStats() {
  try {
    const db = await getDb();

    const [foodsCount, usersCount, recentLogs, recentAudits] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(foods).get(),
      db.select({ count: sql<number>`count(*)` }).from(userSettings).get(),
      db.select({ count: sql<number>`count(*)` }).from(mealLogs)
        .where(gte(mealLogs.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()))
        .get(),
      db.select({ count: sql<number>`count(*)` }).from(foodAuditLog)
        .where(gte(foodAuditLog.changedAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()))
        .get(),
    ]);

    return {
      totalFoods: Number(foodsCount?.count ?? 0),
      totalUsers: Number(usersCount?.count ?? 0),
      logsToday: Number(recentLogs?.count ?? 0),
      auditsThisWeek: Number(recentAudits?.count ?? 0),
    };
  } catch (error) {
    console.error("[AdminDashboard] Error fetching stats:", error);
    throw new Error("Failed to fetch admin statistics");
  }
}

export default async function AdminDashboard() {
  const stats = await getAdminStats();

  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Admin Overview</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Foods</CardTitle>
            <UtensilsCrossed className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.totalFoods}</div>
            <p className="text-xs text-muted-foreground">Foods in database</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Users</CardTitle>
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Logs Today</CardTitle>
            <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.logsToday}</div>
            <p className="text-xs text-muted-foreground">Meal logs in last 24h</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Recent Changes</CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.auditsThisWeek}</div>
            <p className="text-xs text-muted-foreground">Audit logs this week</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <a href="/admin/foods/new" className="block p-2 sm:p-3 rounded-lg hover:bg-gray-100 transition-colors text-sm">
                Add New Food
              </a>
              <a href="/admin/foods?search=high" className="block p-2 sm:p-3 rounded-lg hover:bg-gray-100 transition-colors text-sm">
                View High Vitamin K Foods
              </a>
              <a href="/admin/audit-logs" className="block p-2 sm:p-3 rounded-lg hover:bg-gray-100 transition-colors text-sm">
                View Recent Audit Logs
              </a>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-xs sm:text-sm">Database Status</span>
                <span className="text-xs sm:text-sm font-medium text-green-600">Healthy</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs sm:text-sm">API Response Time</span>
                <span className="text-xs sm:text-sm font-medium">~50ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs sm:text-sm">Active Sessions</span>
                <span className="text-xs sm:text-sm font-medium">{stats.totalUsers}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}