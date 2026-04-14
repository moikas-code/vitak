import { vitamin_k_period_schema } from "@/lib/types";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { getDb } from "@/lib/db";
import { mealLogs, userSettings } from "@/lib/db/schema";
import { eq, gte, lte, and, sum } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

function get_period_dates(period: "daily" | "weekly" | "monthly") {
  const now = new Date();
  const period_start = new Date();
  const period_end = new Date();

  switch (period) {
    case "daily":
      period_start.setHours(0, 0, 0, 0);
      period_end.setHours(23, 59, 59, 999);
      break;
    case "weekly": {
      const day = now.getDay();
      const diff = now.getDate() - day;
      period_start.setDate(diff);
      period_start.setHours(0, 0, 0, 0);
      period_end.setDate(diff + 6);
      period_end.setHours(23, 59, 59, 999);
      break;
    }
    case "monthly":
      period_start.setDate(1);
      period_start.setHours(0, 0, 0, 0);
      period_end.setMonth(period_end.getMonth() + 1);
      period_end.setDate(0);
      period_end.setHours(23, 59, 59, 999);
      break;
  }

  return { period_start, period_end };
}

export const creditRouter = createTRPCRouter({
  getCurrentBalance: protectedProcedure
    .input(vitamin_k_period_schema.optional())
    .query(async ({ ctx, input }) => {
      const period = input ?? "daily";
      const db = await getDb();

      const settings = await db
        .select({
          dailyLimit: userSettings.dailyLimit,
          weeklyLimit: userSettings.weeklyLimit,
          monthlyLimit: userSettings.monthlyLimit,
        })
        .from(userSettings)
        .where(eq(userSettings.userId, ctx.session.userId))
        .get();

      if (!settings) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch user settings",
        });
      }

      const { period_start, period_end } = get_period_dates(period);

      const result = await db
        .select({ total: sum(mealLogs.vitaminKConsumedMcg) })
        .from(mealLogs)
        .where(
          and(
            eq(mealLogs.userId, ctx.session.userId),
            gte(mealLogs.loggedAt, period_start.toISOString()),
            lte(mealLogs.loggedAt, period_end.toISOString())
          )
        )
        .get();

      const credits_used = Number(result?.total ?? 0);
      const credits_limit = settings[`${period}Limit` as keyof typeof settings] as number;

      return {
        user_id: ctx.session.userId,
        period,
        credits_used,
        credits_limit,
        period_start,
        period_end,
      };
    }),

  getAllBalances: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();

    let settings = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, ctx.session.userId))
      .get();

    if (!settings) {
      // Create default settings
      await db.insert(userSettings).values({
        userId: ctx.session.userId,
        dailyLimit: 100,
        weeklyLimit: 700,
        monthlyLimit: 3000,
        trackingPeriod: "daily",
        role: "user",
      });

      settings = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, ctx.session.userId))
        .get();
    }

    if (!settings) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "No user settings available",
      });
    }

    const periods: Array<"daily" | "weekly" | "monthly"> = ["daily", "weekly", "monthly"];
    const balances: Record<string, {
      user_id: string;
      period: "daily" | "weekly" | "monthly";
      credits_used: number;
      credits_limit: number;
      period_start: Date;
      period_end: Date;
    }> = {};

    for (const period of periods) {
      const { period_start, period_end } = get_period_dates(period);

      const result = await db
        .select({ total: sum(mealLogs.vitaminKConsumedMcg) })
        .from(mealLogs)
        .where(
          and(
            eq(mealLogs.userId, ctx.session.userId),
            gte(mealLogs.loggedAt, period_start.toISOString()),
            lte(mealLogs.loggedAt, period_end.toISOString())
          )
        )
        .get();

      const credits_used = Number(result?.total ?? 0);
      const credits_limit = settings[`${period}Limit` as keyof typeof settings] as number;

      balances[period] = {
        user_id: ctx.session.userId,
        period,
        credits_used,
        credits_limit,
        period_start,
        period_end,
      };
    }

    return balances as {
      daily: typeof balances.daily;
      weekly: typeof balances.weekly;
      monthly: typeof balances.monthly;
    };
  }),
});