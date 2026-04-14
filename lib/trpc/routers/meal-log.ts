import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { getDb } from "@/lib/db";
import { mealLogs, foods } from "@/lib/db/schema";
import { eq, gte, lte, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { checkRateLimit, RateLimitError, RATE_LIMITS } from "@/lib/security/rate-limit";
import { mapFood, mapMealLog } from "@/lib/db/mappers";

export const mealLogRouter = createTRPCRouter({
  add: protectedProcedure
    .input(
      z.object({
        food_id: z.string(),
        portion_size_g: z.number().positive(),
      })
    )
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

      const vitamin_k_consumed_mcg = Math.round(
        (input.portion_size_g / 100) * food.vitaminKMcgPer100g
      );

      const [mealLog] = await db
        .insert(mealLogs)
        .values({
          userId: ctx.session.userId,
          foodId: input.food_id,
          portionSizeG: input.portion_size_g,
          vitaminKConsumedMcg: vitamin_k_consumed_mcg,
        })
        .returning();

      if (!mealLog) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create meal log",
        });
      }

      const foodMapped = mapFood(food);
      return {
        ...mapMealLog(mealLog),
        food: foodMapped,
      };
    }),

  getByDateRange: protectedProcedure
    .input(
      z.object({
        start_date: z.string(),
        end_date: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      // Normalize dates to D1 storage format: "YYYY-MM-DD HH:MM:SS"
      const start = input.start_date.replace('T', ' ').replace('Z', '').split('.')[0];
      const end = input.end_date.replace('T', ' ').replace('Z', '').split('.')[0];

      const results = await db
        .select({
          id: mealLogs.id,
          userId: mealLogs.userId,
          foodId: mealLogs.foodId,
          portionSizeG: mealLogs.portionSizeG,
          vitaminKConsumedMcg: mealLogs.vitaminKConsumedMcg,
          loggedAt: mealLogs.loggedAt,
          createdAt: mealLogs.createdAt,
          food: {
            id: foods.id,
            name: foods.name,
            category: foods.category,
            vitaminKMcgPer100g: foods.vitaminKMcgPer100g,
            commonPortionSizeG: foods.commonPortionSizeG,
            commonPortionName: foods.commonPortionName,
            createdBy: foods.createdBy,
            updatedBy: foods.updatedBy,
            createdAt: foods.createdAt,
            updatedAt: foods.updatedAt,
          },
        })
        .from(mealLogs)
        .innerJoin(foods, eq(mealLogs.foodId, foods.id))
        .where(
          and(
            eq(mealLogs.userId, ctx.session.userId),
            gte(mealLogs.loggedAt, start),
            lte(mealLogs.loggedAt, end)
          )
        )
        .orderBy(desc(mealLogs.loggedAt));

      return results.map((log) => ({
        id: log.id,
        user_id: log.userId,
        food_id: log.foodId,
        portion_size_g: log.portionSizeG,
        vitamin_k_consumed_mcg: log.vitaminKConsumedMcg,
        logged_at: new Date(log.loggedAt),
        created_at: new Date(log.createdAt),
        food: {
          id: log.food.id,
          name: log.food.name,
          vitamin_k_mcg_per_100g: log.food.vitaminKMcgPer100g,
          category: log.food.category,
          common_portion_size_g: log.food.commonPortionSizeG,
          common_portion_name: log.food.commonPortionName,
          created_by: log.food.createdBy ?? null,
          updated_by: log.food.updatedBy ?? null,
          created_at: new Date(log.food.createdAt),
          updated_at: new Date(log.food.updatedAt),
        },
      }));
    }),

  getByDate: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const db = await getDb();

      const startOfDay = `${input} 00:00:00`;
      const endOfDay = `${input} 23:59:59`;

      const results = await db
        .select({
          id: mealLogs.id,
          userId: mealLogs.userId,
          foodId: mealLogs.foodId,
          portionSizeG: mealLogs.portionSizeG,
          vitaminKConsumedMcg: mealLogs.vitaminKConsumedMcg,
          loggedAt: mealLogs.loggedAt,
          createdAt: mealLogs.createdAt,
          food: {
            id: foods.id,
            name: foods.name,
            category: foods.category,
            vitaminKMcgPer100g: foods.vitaminKMcgPer100g,
            commonPortionSizeG: foods.commonPortionSizeG,
            commonPortionName: foods.commonPortionName,
            createdBy: foods.createdBy,
            updatedBy: foods.updatedBy,
            createdAt: foods.createdAt,
            updatedAt: foods.updatedAt,
          },
        })
        .from(mealLogs)
        .innerJoin(foods, eq(mealLogs.foodId, foods.id))
        .where(
          and(
            eq(mealLogs.userId, ctx.session.userId),
            gte(mealLogs.loggedAt, startOfDay),
            lte(mealLogs.loggedAt, endOfDay)
          )
        )
        .orderBy(desc(mealLogs.loggedAt));

      return results.map((log) => ({
        id: log.id,
        user_id: log.userId,
        food_id: log.foodId,
        portion_size_g: log.portionSizeG,
        vitamin_k_consumed_mcg: log.vitaminKConsumedMcg,
        logged_at: new Date(log.loggedAt),
        created_at: new Date(log.createdAt),
        food: {
          id: log.food.id,
          name: log.food.name,
          vitamin_k_mcg_per_100g: log.food.vitaminKMcgPer100g,
          category: log.food.category,
          common_portion_size_g: log.food.commonPortionSizeG,
          common_portion_name: log.food.commonPortionName,
          created_by: log.food.createdBy ?? null,
          updated_by: log.food.updatedBy ?? null,
          created_at: new Date(log.food.createdAt),
          updated_at: new Date(log.food.updatedAt),
        },
      }));
    }),

  getToday: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const today = new Date();
    // D1 stores timestamps as "YYYY-MM-DD HH:MM:SS" (space separator)
    // Must match that format for string comparison to work correctly
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const startOfDay = `${y}-${m}-${d} 00:00:00`;
    const endOfDay = `${y}-${m}-${d} 23:59:59`;

    const results = await db
      .select({
        id: mealLogs.id,
        userId: mealLogs.userId,
        foodId: mealLogs.foodId,
        portionSizeG: mealLogs.portionSizeG,
        vitaminKConsumedMcg: mealLogs.vitaminKConsumedMcg,
        loggedAt: mealLogs.loggedAt,
        createdAt: mealLogs.createdAt,
        food: {
          id: foods.id,
          name: foods.name,
          category: foods.category,
          vitaminKMcgPer100g: foods.vitaminKMcgPer100g,
          commonPortionSizeG: foods.commonPortionSizeG,
          commonPortionName: foods.commonPortionName,
          createdBy: foods.createdBy,
          updatedBy: foods.updatedBy,
          createdAt: foods.createdAt,
          updatedAt: foods.updatedAt,
        },
      })
      .from(mealLogs)
      .innerJoin(foods, eq(mealLogs.foodId, foods.id))
      .where(
        and(
          eq(mealLogs.userId, ctx.session.userId),
          gte(mealLogs.loggedAt, startOfDay),
          lte(mealLogs.loggedAt, endOfDay)
        )
      )
      .orderBy(desc(mealLogs.loggedAt));

    return results.map((log) => ({
      id: log.id,
      user_id: log.userId,
      food_id: log.foodId,
      portion_size_g: log.portionSizeG,
      vitamin_k_consumed_mcg: log.vitaminKConsumedMcg,
      logged_at: new Date(log.loggedAt),
      created_at: new Date(log.createdAt),
      food: {
        id: log.food.id,
        name: log.food.name,
        vitamin_k_mcg_per_100g: log.food.vitaminKMcgPer100g,
        category: log.food.category,
        common_portion_size_g: log.food.commonPortionSizeG,
        common_portion_name: log.food.commonPortionName,
        created_by: log.food.createdBy ?? null,
        updated_by: log.food.updatedBy ?? null,
        created_at: new Date(log.food.createdAt),
        updated_at: new Date(log.food.updatedAt),
      },
    }));
  }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      const log = await db
        .select()
        .from(mealLogs)
        .where(eq(mealLogs.id, input))
        .get();

      if (!log || log.userId !== ctx.session.userId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Meal log not found",
        });
      }

      await db.delete(mealLogs).where(eq(mealLogs.id, input));

      return { success: true };
    }),
});