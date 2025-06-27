import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { food_category_schema } from "@/lib/types";
import { createSupabaseClientWithUser, createPublicSupabaseClient } from "@/lib/db/supabase-with-user";
import { TRPCError } from "@trpc/server";

export const foodRouter = createTRPCRouter({
  search: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1).max(100).transform((val) => {
          // Escape special characters that have meaning in ILIKE patterns
          return val.replace(/[%_\\]/g, '\\$&');
        }),
        category: food_category_schema.optional(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const supabase = createSupabaseClientWithUser(ctx.session.userId);
      let query = supabase
        .from("foods")
        .select("*")
        .ilike("name", `%${input.query}%`)
        .limit(input.limit)
        .order("name");

      if (input.category) {
        query = query.eq("category", input.category);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[Food.search] Error:', error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to search foods",
        });
      }

      return data.map((food) => ({
        ...food,
        created_at: new Date(food.created_at),
        updated_at: new Date(food.updated_at),
      }));
    }),

  getById: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const supabase = createSupabaseClientWithUser(ctx.session.userId);
      const { data, error } = await supabase
        .from("foods")
        .select("*")
        .eq("id", input)
        .single();

      if (error) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Food not found",
        });
      }

      return {
        ...data,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
      };
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
    const supabase = createPublicSupabaseClient();
    
    // Get a larger selection of common foods from different categories
    // These are foods that users are likely to log frequently
    const { data, error } = await supabase
      .from("foods")
      .select("*")
      .or(`
        name.ilike.%spinach%,
        name.ilike.%kale%,
        name.ilike.%broccoli%,
        name.ilike.%lettuce%,
        name.ilike.%cabbage%,
        name.ilike.%chicken%,
        name.ilike.%beef%,
        name.ilike.%salmon%,
        name.ilike.%egg%,
        name.ilike.%milk%,
        name.ilike.%rice%,
        name.ilike.%bread%,
        name.ilike.%potato%,
        name.ilike.%tomato%,
        name.ilike.%carrot%,
        name.ilike.%apple%,
        name.ilike.%banana%,
        name.ilike.%cheese%,
        name.ilike.%yogurt%,
        name.ilike.%pasta%
      `)
      .limit(100)
      .order("name");
    
    if (error) {
      console.error('[Food.getCommonFoods] Error:', error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch common foods",
      });
    }
    
    return data.map((food) => ({
      ...food,
      created_at: new Date(food.created_at),
      updated_at: new Date(food.updated_at),
    }));
  }),
});