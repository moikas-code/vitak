import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { createSupabaseClientWithUser } from "@/lib/db/supabase-with-user";
import { TRPCError } from "@trpc/server";
import { checkRateLimit, RATE_LIMITS, RateLimitError } from "@/lib/security/rate-limit-redis";

export const mealLogRouter = createTRPCRouter({
  add: protectedProcedure
    .input(
      z.object({
        food_id: z.string(),
        portion_size_g: z.number().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check rate limit
      try {
        await checkRateLimit(ctx.session.userId, "meal_log", RATE_LIMITS.MEAL_LOG);
      } catch (error) {
        if (error instanceof RateLimitError) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Rate limit exceeded. Please try again later.",
          });
        }
        throw error;
      }

      const supabase = await createSupabaseClientWithUser(ctx.session.userId);
      
      // First, get the food details to calculate vitamin K
      const { data: food, error: foodError } = await supabase
        .from("foods")
        .select("vitamin_k_mcg_per_100g")
        .eq("id", input.food_id)
        .single();

      if (foodError) {
        console.error('[MealLog.add] Food lookup error:', foodError);
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Food not found",
        });
      }

      // Calculate vitamin K consumed
      const vitamin_k_consumed_mcg = (input.portion_size_g / 100) * food.vitamin_k_mcg_per_100g;

      // Insert the meal log with proper user isolation
      const { data, error } = await supabase
        .from("meal_logs")
        .insert({
          user_id: ctx.session.userId,
          food_id: input.food_id,
          portion_size_g: input.portion_size_g,
          vitamin_k_consumed_mcg,
        })
        .select()
        .single();

      if (error) {
        console.error('[MealLog.add] Insert error:', error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to log meal",
        });
      }

      return {
        ...data,
        logged_at: new Date(data.logged_at),
        created_at: new Date(data.created_at),
      };
    }),

  getToday: protectedProcedure.query(async ({ ctx }) => {
    // Check rate limit for read operations
    try {
      await checkRateLimit(ctx.session.userId, "read", RATE_LIMITS.READ);
    } catch (error) {
      if (error instanceof RateLimitError) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Rate limit exceeded. Please try again later.",
        });
      }
      throw error;
    }

    const supabase = await createSupabaseClientWithUser(ctx.session.userId);
    
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from("meal_logs")
      .select("*, food:foods(*)")
      .eq("user_id", ctx.session.userId)
      .gte("logged_at", todayStart.toISOString())
      .lte("logged_at", todayEnd.toISOString())
      .order("logged_at", { ascending: false });

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch today's meals",
      });
    }

    return data.map((log) => ({
      ...log,
      logged_at: new Date(log.logged_at),
      created_at: new Date(log.created_at),
    }));
  }),

  getByDateRange: protectedProcedure
    .input(
      z.object({
        start_date: z.date(),
        end_date: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      const supabase = await createSupabaseClientWithUser(ctx.session.userId);
      const { data, error } = await supabase
        .from("meal_logs")
        .select("*, food:foods(*)")
        .eq("user_id", ctx.session.userId)
        .gte("logged_at", input.start_date.toISOString())
        .lte("logged_at", input.end_date.toISOString())
        .order("logged_at", { ascending: false });

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch meal logs",
        });
      }

      return data.map((log) => ({
        ...log,
        logged_at: new Date(log.logged_at),
        created_at: new Date(log.created_at),
      }));
    }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const supabase = await createSupabaseClientWithUser(ctx.session.userId);
      // First verify the meal belongs to the user
      const { data: mealLog, error: fetchError } = await supabase
        .from("meal_logs")
        .select("user_id")
        .eq("id", input)
        .single();

      if (fetchError || mealLog.user_id !== ctx.session.userId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Meal log not found",
        });
      }

      // Delete the meal log
      const { error } = await supabase
        .from("meal_logs")
        .delete()
        .eq("id", input);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete meal log",
        });
      }

      return { success: true };
    }),
});