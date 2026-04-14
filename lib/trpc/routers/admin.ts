import { z } from "zod";
import { createTRPCRouter, adminProcedure } from "../trpc";
import { getDb } from "@/lib/db";
import { foods, foodAuditLog, userSettings, mealLogs } from "@/lib/db/schema";
import { eq, like, and, desc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { checkRateLimit, RateLimitError, RATE_LIMITS } from "@/lib/security/rate-limit";

import { mapFood, mapUserSettings } from "@/lib/db/mappers";

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

export const adminRouter = createTRPCRouter({
  // Get all foods with pagination
  get_foods: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        search: z.string().optional(),
        category: food_category_enum.optional(),
        sort_by: z.enum(["name", "category", "vitamin_k_mcg_per_100g", "created_at"]).default("name"),
        sort_order: z.enum(["asc", "desc"]).default("asc"),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        await checkRateLimit(ctx.session.userId, "admin_read", RATE_LIMITS.ADMIN_READ);
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
      const offset = (input.page - 1) * input.limit;

      const conditions: any[] = [];
      if (input.search) {
        conditions.push(like(foods.name as any, `%${input.search}%`));
      }
      if (input.category) {
        conditions.push(eq(foods.category as any, input.category));
      }

      const where = conditions.length > 0 ? and(...conditions as [any, ...any[]]) : undefined;

      // Count total
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(foods)
        .where(where!)
        .get();

      const total = Number(countResult?.count ?? 0);

      // Sort column mapping
      const sortCols: Record<string, any> = {
        name: foods.name,
        category: foods.category,
        vitamin_k_mcg_per_100g: foods.vitaminKMcgPer100g,
        created_at: foods.createdAt,
      };
      const sortCol = sortCols[input.sort_by] ?? foods.name;
      const orderBy = input.sort_order === 'asc' ? sortCol : desc(sortCol);

      const data = await db
        .select()
        .from(foods)
        .where(where!)
        .orderBy(orderBy)
        .limit(input.limit)
        .offset(offset);

      return {
        foods: (data || []).map(mapFood),
        total,
        page: input.page,
        limit: input.limit,
        total_pages: Math.ceil(total / input.limit),
      };
    }),

  // Create new food
  create_food: adminProcedure
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
        await checkRateLimit(ctx.session.userId, "admin_write", RATE_LIMITS.ADMIN_WRITE);
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
          ...input,
          vitaminKMcgPer100g: input.vitamin_k_mcg_per_100g,
          commonPortionSizeG: input.common_portion_size_g,
          commonPortionName: input.common_portion_name,
          createdBy: ctx.session.userId,
          updatedBy: ctx.session.userId,
        })
        .returning();

      if (!food) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create food",
        });
      }

      // Log the action
      await db.insert(foodAuditLog).values({
        foodId: food.id,
        action: "create",
        changedBy: ctx.session.userId,
        newValues: JSON.stringify(food),
        ipAddress: ctx.headers.get("x-forwarded-for") || ctx.headers.get("x-real-ip") || null,
        userAgent: ctx.headers.get("user-agent") || null,
      });

      return mapFood(food!);
    }),

  // Update food
  update_food: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(255).optional(),
        vitamin_k_mcg_per_100g: z.number().min(0).optional(),
        category: food_category_enum.optional(),
        common_portion_size_g: z.number().min(0).optional(),
        common_portion_name: z.string().min(1).max(100).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...update_data } = input;
      const db = await getDb();

      // Get current food data for audit
      const old_food = await db
        .select()
        .from(foods)
        .where(eq(foods.id, id))
        .get();

      if (!old_food) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Food not found",
        });
      }

      // Map camelCase input to schema column names
      const setData: Record<string, unknown> = { updatedBy: ctx.session.userId };
      if (update_data.name !== undefined) setData["name"] = update_data.name;
      if (update_data.vitamin_k_mcg_per_100g !== undefined) setData["vitaminKMcgPer100g"] = update_data.vitamin_k_mcg_per_100g;
      if (update_data.category !== undefined) setData["category"] = update_data.category;
      if (update_data.common_portion_size_g !== undefined) setData["commonPortionSizeG"] = update_data.common_portion_size_g;
      if (update_data.common_portion_name !== undefined) setData["commonPortionName"] = update_data.common_portion_name;

      const [food] = await db
        .update(foods)
        .set(setData)
        .where(eq(foods.id, id))
        .returning();

      if (!food) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update food",
        });
      }

      // Log the action
      await db.insert(foodAuditLog).values({
        foodId: id,
        action: "update",
        changedBy: ctx.session.userId,
        oldValues: JSON.stringify(old_food),
        newValues: JSON.stringify(food),
        ipAddress: ctx.headers.get("x-forwarded-for") || ctx.headers.get("x-real-ip") || null,
        userAgent: ctx.headers.get("user-agent") || null,
      });

      return mapFood(food!);
    }),

  // Delete food
  delete_food: adminProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();

      // Get food data for audit log
      const food = await db
        .select()
        .from(foods)
        .where(eq(foods.id, input.id))
        .get();

      if (!food) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Food not found",
        });
      }

      await db
        .delete(foods)
        .where(eq(foods.id, input.id));

      // Log the action
      await db.insert(foodAuditLog).values({
        foodId: input.id,
        action: "delete",
        changedBy: ctx.session.userId,
        oldValues: JSON.stringify(food),
        ipAddress: ctx.headers.get("x-forwarded-for") || ctx.headers.get("x-real-ip") || null,
        userAgent: ctx.headers.get("user-agent") || null,
      });

      return { success: true };
    }),

  // Bulk import foods
  import_foods: adminProcedure
    .input(
      z.object({
        foods: z.array(
          z.object({
            name: z.string().min(1).max(255),
            vitamin_k_mcg_per_100g: z.number().min(0),
            category: food_category_enum,
            common_portion_size_g: z.number().min(0),
            common_portion_name: z.string().min(1).max(100),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await checkRateLimit(ctx.session.userId, "admin_bulk", RATE_LIMITS.ADMIN_BULK);
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

      const foods_to_insert = input.foods.map((food) => ({
        name: food.name,
        vitaminKMcgPer100g: food.vitamin_k_mcg_per_100g,
        category: food.category,
        commonPortionSizeG: food.common_portion_size_g,
        commonPortionName: food.common_portion_name,
        createdBy: ctx.session.userId,
        updatedBy: ctx.session.userId,
      }));

      const inserted = await db.insert(foods).values(foods_to_insert).returning();

      // Log the bulk action
      if (inserted.length > 0) {
        const audit_logs = inserted.map((food) => ({
          foodId: food.id,
          action: "create" as const,
          changedBy: ctx.session.userId,
          newValues: JSON.stringify(food),
          ipAddress: ctx.headers.get("x-forwarded-for") || ctx.headers.get("x-real-ip") || null,
          userAgent: ctx.headers.get("user-agent") || null,
        }));

        await db.insert(foodAuditLog).values(audit_logs);
      }

      return {
        imported: inserted?.length || 0,
        foods: (inserted || []).map(mapFood),
      };
    }),

  // Get audit logs
  get_audit_logs: adminProcedure
    .input(
      z.object({
        food_id: z.string().optional(),
        changed_by: z.string().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      const offset = (input.page - 1) * input.limit;

      const conditions: any[] = [];
      if (input.food_id) {
        conditions.push(eq(foodAuditLog.foodId, input.food_id));
      }
      if (input.changed_by) {
        conditions.push(eq(foodAuditLog.changedBy, input.changed_by));
      }

      const where = conditions.length > 0 ? and(...conditions as [any, ...any[]]) : undefined;

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(foodAuditLog)
        .where(where!)
        .get();

      const total = Number(countResult?.count ?? 0);

      const data = await db
        .select()
        .from(foodAuditLog)
        .where(where!)
        .orderBy(desc(foodAuditLog.changedAt))
        .limit(input.limit)
        .offset(offset);

      // Get food names for the logs
      const foodIds = [...new Set(data.map((log) => log.foodId))];
      const foodNames = await db
        .select({ id: foods.id, name: foods.name })
        .from(foods)
        .where(foodIds.length > 0 ? sql`${foods.id} IN (${sql.join(foodIds.map((id) => sql`${id}`), sql`, `)})` : sql`1=0`)
        .all();

      const foodMap = new Map(foodNames.map((f) => [f.id, f.name]));

      const logs = data.map((log) => ({
        id: log.id,
        food_id: log.foodId,
        action: log.action,
        changed_by: log.changedBy,
        changed_at: log.changedAt,
        old_values: log.oldValues ? JSON.parse(log.oldValues) : null,
        new_values: log.newValues ? JSON.parse(log.newValues) : null,
        ip_address: log.ipAddress,
        user_agent: log.userAgent,
        food: { name: foodMap.get(log.foodId) || "Unknown" },
      }));

      return {
        logs,
        total,
        page: input.page,
        limit: input.limit,
        total_pages: Math.ceil(total / input.limit),
      };
    }),

  // Get single food by ID
  get_food_by_id: adminProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();

      const food = await db
        .select()
        .from(foods)
        .where(eq(foods.id, input.id))
        .get();

      if (!food) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Food not found",
        });
      }

      return mapFood(food!);
    }),

  // User management
  get_users: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        search: z.string().optional(),
        role: z.enum(["all", "user", "admin"]).default("all"),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      const offset = (input.page - 1) * input.limit;

      const conditions: any[] = [];
      if (input.role !== "all") {
        conditions.push(eq(userSettings.role as any, input.role));
      }
      // Note: search on users table would need a join. For now, search on user_id.
      if (input.search) {
        conditions.push(like(userSettings.userId as any, `%${input.search}%`));
      }

      const where = conditions.length > 0 ? and(...conditions as [any, ...any[]]) : undefined;

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(userSettings)
        .where(where!)
        .get();

      const total = Number(countResult?.count ?? 0);

      const data = await db
        .select()
        .from(userSettings)
        .where(where!)
        .orderBy(desc(userSettings.createdAt))
        .limit(input.limit)
        .offset(offset);

      return {
        users: (data || []).map(mapUserSettings),
        total,
        page: input.page,
        limit: input.limit,
        total_pages: Math.ceil(total / input.limit),
      };
    }),

  // Update user role
  update_user_role: adminProcedure
    .input(
      z.object({
        user_id: z.string(),
        role: z.enum(["user", "admin"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Prevent self-demotion
      if (input.user_id === ctx.session.userId && input.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot remove your own admin role",
        });
      }

      const db = await getDb();

      const [updated] = await db
        .update(userSettings)
        .set({ role: input.role })
        .where(eq(userSettings.userId, input.user_id))
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update user role",
        });
      }

      return mapUserSettings(updated);
    }),

  // Get user statistics
  get_user_stats: adminProcedure
    .input(
      z.object({
        user_id: z.string(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();

      const mealCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(mealLogs)
        .where(eq(mealLogs.userId, input.user_id))
        .get();

      const lastActivity = await db
        .select({ loggedAt: mealLogs.loggedAt })
        .from(mealLogs)
        .where(eq(mealLogs.userId, input.user_id))
        .orderBy(desc(mealLogs.loggedAt))
        .limit(1)
        .get();

      return {
        total_meal_logs: Number(mealCount?.count ?? 0),
        last_activity: lastActivity?.loggedAt || null,
      };
    }),
});