import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { getDb } from "@/lib/db";
import { mapMealLog, mapFood } from "@/lib/db/mappers";
import { mealPresets, foods, mealLogs } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { checkRateLimit, RATE_LIMITS, RateLimitError } from "@/lib/security/rate-limit";

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

      const db = await getDb();

      // Get food details
      const food = await db
        .select()
        .from(foods)
        .where(eq(foods.id, input.food_id))
        .get();

      if (!food) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Food not found",
        });
      }

      const vitamin_k_mcg = Math.ceil(
        (input.portion_size_g / 100) * food.vitaminKMcgPer100g
      );

      // Check preset limit (max 20)
      const presetCount = await db
        .select({ id: mealPresets.id })
        .from(mealPresets)
        .where(eq(mealPresets.userId, ctx.session.userId))
        .all();

      if (presetCount.length >= 20) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Maximum preset limit (20) reached. Please delete some presets first.",
        });
      }

      try {
        const [preset] = await db
          .insert(mealPresets)
          .values({
            userId: ctx.session.userId,
            name: input.name,
            foodId: input.food_id,
            portionSizeG: input.portion_size_g,
            vitaminKMcg: vitamin_k_mcg,
          })
          .returning();

        if (!preset) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create preset",
          });
        }

        return {
          ...preset,
          created_at: new Date(preset.createdAt),
          updated_at: new Date(preset.updatedAt),
        };
      } catch (error: unknown) {
        // SQLite unique constraint error
        if (error instanceof Error && error.message?.includes("UNIQUE constraint failed")) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "A preset with this name already exists",
          });
        }
        throw error;
      }
    }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
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

    const db = await getDb();

    const results = await db
      .select({
        id: mealPresets.id,
        userId: mealPresets.userId,
        name: mealPresets.name,
        foodId: mealPresets.foodId,
        portionSizeG: mealPresets.portionSizeG,
        vitaminKMcg: mealPresets.vitaminKMcg,
        usageCount: mealPresets.usageCount,
        createdAt: mealPresets.createdAt,
        updatedAt: mealPresets.updatedAt,
        food: {
          id: foods.id,
          name: foods.name,
          category: foods.category,
          vitaminKMcgPer100g: foods.vitaminKMcgPer100g,
          commonPortionSizeG: foods.commonPortionSizeG,
          commonPortionName: foods.commonPortionName,
        },
      })
      .from(mealPresets)
      .innerJoin(foods, eq(mealPresets.foodId, foods.id))
      .where(eq(mealPresets.userId, ctx.session.userId))
      .orderBy(desc(mealPresets.usageCount), desc(mealPresets.createdAt));

    return results.map((preset) => ({
      ...preset,
      created_at: new Date(preset.createdAt),
      updated_at: new Date(preset.updatedAt),
      food: {
        ...preset.food,
        created_at: new Date(),
        updated_at: new Date(),
      },
    }));
  }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      // Verify ownership
      const preset = await db
        .select()
        .from(mealPresets)
        .where(eq(mealPresets.id, input))
        .get();

      if (!preset || preset.userId !== ctx.session.userId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Preset not found",
        });
      }

      await db
        .delete(mealPresets)
        .where(eq(mealPresets.id, input));

      return { success: true };
    }),

  logFromPreset: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
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

      const db = await getDb();

      // Get the preset
      const preset = await db
        .select()
        .from(mealPresets)
        .where(
          and(eq(mealPresets.id, input), eq(mealPresets.userId, ctx.session.userId))
        )
        .get();

      if (!preset) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Preset not found",
        });
      }

      // Insert the meal log
      const [mealLog] = await db
        .insert(mealLogs)
        .values({
          userId: ctx.session.userId,
          foodId: preset.foodId,
          portionSizeG: preset.portionSizeG,
          vitaminKConsumedMcg: preset.vitaminKMcg,
        })
        .returning();

      if (!mealLog) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to log meal from preset",
        });
      }

      // Increment usage count
      await db
        .update(mealPresets)
        .set({ usageCount: preset.usageCount + 1 })
        .where(eq(mealPresets.id, input));

      const food = await db
        .select()
        .from(foods)
        .where(eq(foods.id, preset.foodId))
        .get();

      return {
        ...mapMealLog(mealLog),
        food: food ? mapFood(food) : null,
      };
    }),
});