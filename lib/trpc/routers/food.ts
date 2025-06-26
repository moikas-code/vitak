import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { food_category_schema } from "@/lib/types";
import { createServerSupabaseClient } from "@/lib/db/supabase-server";
import { TRPCError } from "@trpc/server";

export const foodRouter = createTRPCRouter({
  search: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1),
        category: food_category_schema.optional(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx: _ctx, input }) => {
      const supabase = await createServerSupabaseClient();
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
    .query(async ({ ctx: _ctx, input }) => {
      const supabase = await createServerSupabaseClient();
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
});