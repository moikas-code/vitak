import { createTRPCRouter, protectedProcedure } from "../trpc";
import { vitamin_k_period_schema } from "@/lib/types";
import { createSupabaseClientWithUser, createDefaultUserSettings } from "@/lib/db/supabase-with-user";
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
    case "weekly":
      const day = now.getDay();
      const diff = now.getDate() - day; // Sunday = 0
      period_start.setDate(diff);
      period_start.setHours(0, 0, 0, 0);
      period_end.setDate(diff + 6);
      period_end.setHours(23, 59, 59, 999);
      break;
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
      
      try {
        // Get user settings using the user ID from session context
        const supabase = createSupabaseClientWithUser(ctx.session.userId);
      const { data: settings, error: settingsError } = await supabase
        .from("user_settings")
        .select("daily_limit, weekly_limit, monthly_limit")
        .eq("user_id", ctx.session.userId)
        .single();

      if (settingsError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch user settings",
        });
      }

      const { period_start, period_end } = get_period_dates(period);

      // Calculate credits used in the period
      const { data: mealLogs, error: logsError } = await supabase
        .from("meal_logs")
        .select("vitamin_k_consumed_mcg")
        .eq("user_id", ctx.session.userId)
        .gte("logged_at", period_start.toISOString())
        .lte("logged_at", period_end.toISOString());

      if (logsError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to calculate credits",
        });
      }

      const credits_used = mealLogs.reduce(
        (sum, log) => sum + log.vitamin_k_consumed_mcg,
        0
      );

      const credits_limit = settings[`${period}_limit` as keyof typeof settings] as number;

      return {
        user_id: ctx.session.userId,
        period,
        credits_used,
        credits_limit,
        period_start,
        period_end,
      };
      } catch (error) {
        console.error('[Credit.getCurrentBalance] Error:', error);
        throw error;
      }
    }),

  getAllBalances: protectedProcedure.query(async ({ ctx }) => {
    try {
      console.log('[Credit.getAllBalances] Starting for user:', ctx.session.userId);
      
      // Get user settings using the user ID from session context
      const supabase = createSupabaseClientWithUser(ctx.session.userId);
    const { data: initial_settings, error: settingsError } = await supabase
      .from("user_settings")
      .select("daily_limit, weekly_limit, monthly_limit")
      .eq("user_id", ctx.session.userId)
      .single();

    let settings = initial_settings;

    if (settingsError) {
      // If settings don't exist, create default settings
      if (settingsError.code === 'PGRST116') { // No rows returned
        console.log('[Credit] No user settings found, creating defaults for user:', ctx.session.userId);
        
        // Use service role client to create default settings
        const new_settings = await createDefaultUserSettings(ctx.session.userId);
        
        if (!new_settings) {
          console.error('[Credit] Failed to create default settings for user:', ctx.session.userId);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create user settings",
          });
        }
        
        // Use the newly created settings
        settings = new_settings;
      } else {
        console.error('[Credit] Settings error:', settingsError);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch user settings",
        });
      }
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

      // Calculate credits used in each period
      const { data: mealLogs, error: logsError } = await supabase
        .from("meal_logs")
        .select("vitamin_k_consumed_mcg")
        .eq("user_id", ctx.session.userId)
        .gte("logged_at", period_start.toISOString())
        .lte("logged_at", period_end.toISOString());

      if (logsError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to calculate ${period} credits`,
        });
      }

      const credits_used = mealLogs.reduce(
        (sum, log) => sum + log.vitamin_k_consumed_mcg,
        0
      );

      const credits_limit = settings[`${period}_limit` as keyof typeof settings] as number;

      balances[period] = {
        user_id: ctx.session.userId,
        period,
        credits_used,
        credits_limit,
        period_start,
        period_end,
      };
    }

    console.log('[Credit.getAllBalances] Returning balances for user:', ctx.session.userId);
    return balances as {
      daily: typeof balances.daily;
      weekly: typeof balances.weekly;
      monthly: typeof balances.monthly;
    };
    } catch (error) {
      console.error('[Credit.getAllBalances] Error for user', ctx.session.userId, ':', error);
      throw error;
    }
  }),
});