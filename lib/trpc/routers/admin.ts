import { z } from "zod";
import { createTRPCRouter, adminProcedure } from "@/lib/trpc/trpc";
import { supabaseServiceRole } from "@/lib/db/supabase-server";
import { TRPCError } from "@trpc/server";
import { checkRateLimit, RateLimitError, RATE_LIMITS } from "@/lib/security/rate-limit-redis";

const food_category_enum = z.enum([
  "vegetables", 
  "fruits", 
  "proteins", 
  "grains", 
  "dairy", 
  "fats_oils", 
  "beverages", 
  "other"
]);

export const adminRouter = createTRPCRouter({
  // Get all foods with pagination
  get_foods: adminProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
      search: z.string().optional(),
      category: food_category_enum.optional(),
      sort_by: z.enum(["name", "category", "vitamin_k_mcg_per_100g", "created_at"]).default("name"),
      sort_order: z.enum(["asc", "desc"]).default("asc"),
    }))
    .query(async ({ ctx, input }) => {
      // Check rate limit
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
      
      const offset = (input.page - 1) * input.limit;
      
      let query = supabaseServiceRole
        .from("foods")
        .select("*", { count: "exact" });
      
      // Apply search filter
      if (input.search) {
        query = query.ilike("name", `%${input.search}%`);
      }
      
      // Apply category filter
      if (input.category) {
        query = query.eq("category", input.category);
      }
      
      // Apply sorting
      query = query.order(input.sort_by, { ascending: input.sort_order === "asc" });
      
      // Apply pagination
      query = query.range(offset, offset + input.limit - 1);
      
      const { data, error, count } = await query;
      
      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch foods",
        });
      }
      
      return {
        foods: data || [],
        total: count || 0,
        page: input.page,
        limit: input.limit,
        total_pages: Math.ceil((count || 0) / input.limit),
      };
    }),
  
  // Create new food
  create_food: adminProcedure
    .input(z.object({
      name: z.string().min(1).max(255),
      vitamin_k_mcg_per_100g: z.number().min(0),
      category: food_category_enum,
      common_portion_size_g: z.number().min(0),
      common_portion_name: z.string().min(1).max(100),
    }))
    .mutation(async ({ input, ctx }) => {
      // Check rate limit
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
      const { data: food, error } = await supabaseServiceRole
        .from("foods")
        .insert({
          ...input,
          created_by: ctx.session.userId,
          updated_by: ctx.session.userId,
        })
        .select()
        .single();
      
      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create food",
        });
      }
      
      // Log the action
      await supabaseServiceRole
        .from("food_audit_log")
        .insert({
          food_id: food.id,
          action: "create",
          changed_by: ctx.session.userId,
          new_values: food,
          ip_address: ctx.headers.get("x-forwarded-for") || ctx.headers.get("x-real-ip"),
          user_agent: ctx.headers.get("user-agent"),
        });
      
      return food;
    }),
  
  // Update food
  update_food: adminProcedure
    .input(z.object({
      id: z.string().uuid(),
      name: z.string().min(1).max(255).optional(),
      vitamin_k_mcg_per_100g: z.number().min(0).optional(),
      category: food_category_enum.optional(),
      common_portion_size_g: z.number().min(0).optional(),
      common_portion_name: z.string().min(1).max(100).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...update_data } = input;
      
      // Get current food data for audit log
      const { data: old_food } = await supabaseServiceRole
        .from("foods")
        .select()
        .eq("id", id)
        .single();
      
      // Update food
      const { data: food, error } = await supabaseServiceRole
        .from("foods")
        .update({
          ...update_data,
          updated_by: ctx.session.userId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();
      
      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update food",
        });
      }
      
      // Log the action
      await supabaseServiceRole
        .from("food_audit_log")
        .insert({
          food_id: id,
          action: "update",
          changed_by: ctx.session.userId,
          old_values: old_food,
          new_values: food,
          ip_address: ctx.headers.get("x-forwarded-for") || ctx.headers.get("x-real-ip"),
          user_agent: ctx.headers.get("user-agent"),
        });
      
      return food;
    }),
  
  // Delete food
  delete_food: adminProcedure
    .input(z.object({
      id: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Get food data for audit log
      const { data: food } = await supabaseServiceRole
        .from("foods")
        .select()
        .eq("id", input.id)
        .single();
      
      // Delete food
      const { error } = await supabaseServiceRole
        .from("foods")
        .delete()
        .eq("id", input.id);
      
      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete food",
        });
      }
      
      // Log the action
      await supabaseServiceRole
        .from("food_audit_log")
        .insert({
          food_id: input.id,
          action: "delete",
          changed_by: ctx.session.userId,
          old_values: food,
          ip_address: ctx.headers.get("x-forwarded-for") || ctx.headers.get("x-real-ip"),
          user_agent: ctx.headers.get("user-agent"),
        });
      
      return { success: true };
    }),
  
  // Bulk import foods
  import_foods: adminProcedure
    .input(z.object({
      foods: z.array(z.object({
        name: z.string().min(1).max(255),
        vitamin_k_mcg_per_100g: z.number().min(0),
        category: food_category_enum,
        common_portion_size_g: z.number().min(0),
        common_portion_name: z.string().min(1).max(100),
      })),
    }))
    .mutation(async ({ input, ctx }) => {
      // Check rate limit
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
      const foods_with_audit = input.foods.map(food => ({
        ...food,
        created_by: ctx.session.userId,
        updated_by: ctx.session.userId,
      }));
      
      const { data, error } = await supabaseServiceRole
        .from("foods")
        .insert(foods_with_audit)
        .select();
      
      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to import foods",
        });
      }
      
      // Log the bulk action
      if (data) {
        const audit_logs = data.map((food) => ({
          food_id: food.id,
          action: "create" as const,
          changed_by: ctx.session.userId,
          new_values: food,
          ip_address: ctx.headers.get("x-forwarded-for") || ctx.headers.get("x-real-ip"),
          user_agent: ctx.headers.get("user-agent"),
        }));
        
        await supabaseServiceRole
          .from("food_audit_log")
          .insert(audit_logs);
      }
      
      return {
        imported: data?.length || 0,
        foods: data || [],
      };
    }),
  
  // Get audit logs
  get_audit_logs: adminProcedure
    .input(z.object({
      food_id: z.string().uuid().optional(),
      changed_by: z.string().optional(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
    }))
    .query(async ({ input }) => {
      const offset = (input.page - 1) * input.limit;
      
      let query = supabaseServiceRole
        .from("food_audit_log")
        .select(`
          *,
          food:foods(name)
        `, { count: "exact" });
      
      if (input.food_id) {
        query = query.eq("food_id", input.food_id);
      }
      
      if (input.changed_by) {
        query = query.eq("changed_by", input.changed_by);
      }
      
      query = query
        .order("changed_at", { ascending: false })
        .range(offset, offset + input.limit - 1);
      
      const { data, error, count } = await query;
      
      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch audit logs",
        });
      }
      
      return {
        logs: data || [],
        total: count || 0,
        page: input.page,
        limit: input.limit,
        total_pages: Math.ceil((count || 0) / input.limit),
      };
    }),
  
  // Get single food by ID
  get_food_by_id: adminProcedure
    .input(z.object({
      id: z.string().uuid(),
    }))
    .query(async ({ input }) => {
      const { data, error } = await supabaseServiceRole
        .from("foods")
        .select("*")
        .eq("id", input.id)
        .single();
      
      if (error) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Food not found",
        });
      }
      
      return data;
    }),
  
  // User management endpoints
  get_users: adminProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
      search: z.string().optional(),
      role: z.enum(["all", "user", "admin"]).default("all"),
    }))
    .query(async ({ input }) => {
      const offset = (input.page - 1) * input.limit;
      
      let query = supabaseServiceRole
        .from("user_settings")
        .select(`
          *,
          users(*)
        `, { count: "exact" });
      
      // Apply search filter (search in users table)
      if (input.search) {
        query = query.or(`username.ilike.%${input.search}%,email.ilike.%${input.search}%`, { foreignTable: "users" });
      }
      
      // Apply role filter
      if (input.role !== "all") {
        query = query.eq("role", input.role);
      }
      
      // Apply sorting and pagination
      query = query
        .order("created_at", { ascending: false })
        .range(offset, offset + input.limit - 1);
      
      const { data, error, count } = await query;
      
      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch users",
        });
      }
      
      return {
        users: data || [],
        total: count || 0,
        page: input.page,
        limit: input.limit,
        total_pages: Math.ceil((count || 0) / input.limit),
      };
    }),
  
  // Update user role
  update_user_role: adminProcedure
    .input(z.object({
      user_id: z.string(),
      role: z.enum(["user", "admin"]),
    }))
    .mutation(async ({ input, ctx }) => {
      // Prevent self-demotion
      if (input.user_id === ctx.session.userId && input.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot remove your own admin role",
        });
      }
      
      const { data, error } = await supabaseServiceRole
        .from("user_settings")
        .update({ role: input.role })
        .eq("user_id", input.user_id)
        .select();
      
      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update user role",
        });
      }
      
      // Also update Clerk metadata if needed
      // This would require Clerk Backend API
      
      return data?.[0];
    }),
  
  // Get user statistics
  get_user_stats: adminProcedure
    .input(z.object({
      user_id: z.string(),
    }))
    .query(async ({ input }) => {
      const [mealLogsCount, lastActivity] = await Promise.all([
        supabaseServiceRole
          .from("meal_logs")
          .select("*", { count: "exact", head: true })
          .eq("user_id", input.user_id),
        supabaseServiceRole
          .from("meal_logs")
          .select("logged_at")
          .eq("user_id", input.user_id)
          .order("logged_at", { ascending: false })
          .limit(1),
      ]);
      
      return {
        total_meal_logs: mealLogsCount.count || 0,
        last_activity: lastActivity.data?.[0]?.logged_at || null,
      };
    }),
});