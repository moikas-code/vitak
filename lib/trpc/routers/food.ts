import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { food_category_schema } from "@/lib/types";
import { getDb } from "@/lib/db";
import { foods, foodAuditLog } from "@/lib/db/schema";
import { eq, like, or, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { checkRateLimit, RateLimitError, RATE_LIMITS } from "@/lib/security/rate-limit";
import { mapFood } from "@/lib/db/mappers";

const food_category_enum = z.enum([
  "vegetables",
  "fruits",
  "proteins",
  "grains",
  "dairy",
  "fats_oils",
  "beverages",
  "nuts_seeds",
  "herbs_spices",
  "prepared_foods",
  "other",
]);

export const foodRouter = createTRPCRouter({
  search: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1).max(100).transform((val) => {
          return val.replace(/[%_\\]/g, "\\$&");
        }),
        category: food_category_schema.optional(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        await checkRateLimit(ctx.session.userId, "food_search", RATE_LIMITS.FOOD_SEARCH);
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

      const conditions = [like(foods.name, `%${input.query}%`)];
      if (input.category) {
        conditions.push(eq(foods.category, input.category));
      }

      const results = await db
        .select()
        .from(foods)
        .where(and(...conditions))
        .limit(input.limit)
        .orderBy(foods.name);

      return results.map(mapFood);
    }),

  getById: protectedProcedure
    .input(z.string())
    .query(async ({ ctx: _ctx, input }) => {
      const db = await getDb();
      const food = await db
        .select()
        .from(foods)
        .where(eq(foods.id, input))
        .get();

      if (!food) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Food not found",
        });
      }

      return mapFood(food);
    }),

  getCategories: protectedProcedure.query(async ({ ctx: _ctx }) => {
    return [
      { value: "vegetables", label: "Vegetables" },
      { value: "fruits", label: "Fruits" },
      { value: "proteins", label: "Proteins" },
      { value: "grains", label: "Grains" },
      { value: "dairy", label: "Dairy" },
      { value: "fats_oils", label: "Fats & Oils" },
      { value: "beverages", label: "Beverages" },
      { value: "other", label: "Other" },
    ];
  }),

  getCommonFoods: publicProcedure.query(async () => {
    const db = await getDb();

    const commonNames = [
      "spinach", "kale", "broccoli", "lettuce", "cabbage",
      "chicken", "beef", "salmon", "egg", "milk",
      "rice", "bread", "potato", "tomato", "carrot",
      "apple", "banana", "cheese", "yogurt", "pasta",
    ];

    const results = await db
      .select()
      .from(foods)
      .where(or(...commonNames.map((name) => like(foods.name, `%${name}%`))))
      .limit(100)
      .orderBy(foods.name);

    return results.map(mapFood);
  }),

  create_custom: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        vitamin_k_mcg_per_100g: z.number().min(0),
        category: food_category_enum,
        common_portion_size_g: z.number().min(0),
        common_portion_name: z.string().min(1).max(100),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await checkRateLimit(ctx.session.userId, "food_search", RATE_LIMITS.FOOD_SEARCH);
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

      const [food] = await db
        .insert(foods)
        .values({
          name: input.name,
          vitaminKMcgPer100g: input.vitamin_k_mcg_per_100g,
          category: input.category,
          commonPortionSizeG: input.common_portion_size_g,
          commonPortionName: input.common_portion_name,
          dataSource: "user_submitted",
          createdBy: ctx.session.userId,
          updatedBy: ctx.session.userId,
        })
        .returning();

      if (!food) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create custom food",
        });
      }

      await db.insert(foodAuditLog).values({
        action: "create",
        foodId: food.id,
        changedAt: new Date().toISOString(),
        changedBy: ctx.session.userId,
        newValues: JSON.stringify(input),
        ipAddress: ctx.headers.get("x-forwarded-for") || ctx.headers.get("x-real-ip") || null,
        userAgent: ctx.headers.get("user-agent") || null,
      });

      return mapFood(food);
    }),
});