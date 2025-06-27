import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { createSupabaseClientWithUser } from "@/lib/db/supabase-with-user";
import { TRPCError } from "@trpc/server";
import { checkRateLimit, RATE_LIMITS, RateLimitError } from "@/lib/security/rate-limit-redis";

export const mealPresetRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(50),
        food_id: z.string(),
        portion_size_g: z.number().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check rate limit
      try {
        await checkRateLimit(ctx.session.userId, "preset_create", RATE_LIMITS.MEAL_LOG);
      } catch (error) {
        if (error instanceof RateLimitError) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Rate limit exceeded. Please try again later.",
          });
        }
        throw error;
      }

      const supabase = createSupabaseClientWithUser(ctx.session.userId);
      
      // First, get the food details to calculate vitamin K
      const { data: food, error: foodError } = await supabase
        .from("foods")
        .select("vitamin_k_mcg_per_100g")
        .eq("id", input.food_id)
        .single();

      if (foodError) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Food not found",
        });
      }

      // Calculate vitamin K for the preset
      const vitamin_k_mcg = (input.portion_size_g / 100) * food.vitamin_k_mcg_per_100g;

      // Check if user already has 20 presets (limit)
      const { count, error: countError } = await supabase
        .from("meal_presets")
        .select("*", { count: "exact", head: true })
        .eq("user_id", ctx.session.userId);

      if (countError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to check preset count",
        });
      }

      if (count && count >= 20) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Maximum preset limit (20) reached. Please delete some presets first.",
        });
      }

      // Insert the preset
      const { data, error } = await supabase
        .from("meal_presets")
        .insert({
          user_id: ctx.session.userId,
          name: input.name,
          food_id: input.food_id,
          portion_size_g: input.portion_size_g,
          vitamin_k_mcg,
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") { // Unique constraint violation
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "A preset with this name already exists",
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create preset",
        });
      }

      return {
        ...data,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
      };
    }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    // Check rate limit
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

    const supabase = createSupabaseClientWithUser(ctx.session.userId);
    
    const { data, error } = await supabase
      .from("meal_presets")
      .select("*, food:foods(*)")
      .eq("user_id", ctx.session.userId)
      .order("usage_count", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch presets",
      });
    }

    return data.map((preset) => ({
      ...preset,
      created_at: new Date(preset.created_at),
      updated_at: new Date(preset.updated_at),
    }));
  }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const supabase = createSupabaseClientWithUser(ctx.session.userId);
      
      // First verify the preset belongs to the user
      const { data: preset, error: fetchError } = await supabase
        .from("meal_presets")
        .select("user_id")
        .eq("id", input)
        .single();

      if (fetchError || preset.user_id !== ctx.session.userId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Preset not found",
        });
      }

      // Delete the preset
      const { error } = await supabase
        .from("meal_presets")
        .delete()
        .eq("id", input);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete preset",
        });
      }

      return { success: true };
    }),

  logFromPreset: protectedProcedure
    .input(z.string())
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

      const supabase = createSupabaseClientWithUser(ctx.session.userId);
      
      // Get the preset details
      const { data: preset, error: presetError } = await supabase
        .from("meal_presets")
        .select("*")
        .eq("id", input)
        .eq("user_id", ctx.session.userId)
        .single();

      if (presetError || !preset) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Preset not found",
        });
      }

      // Insert the meal log
      const { data: mealLog, error: mealError } = await supabase
        .from("meal_logs")
        .insert({
          user_id: ctx.session.userId,
          food_id: preset.food_id,
          portion_size_g: preset.portion_size_g,
          vitamin_k_consumed_mcg: preset.vitamin_k_mcg,
        })
        .select()
        .single();

      if (mealError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to log meal from preset",
        });
      }

      // Increment usage count for the preset
      await supabase
        .from("meal_presets")
        .update({ usage_count: preset.usage_count + 1 })
        .eq("id", input);

      return {
        ...mealLog,
        logged_at: new Date(mealLog.logged_at),
        created_at: new Date(mealLog.created_at),
      };
    }),
});