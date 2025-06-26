/**
 * Secure database queries that enforce user isolation at the application layer
 * These functions ensure users can only access their own data
 */

import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";
import type { UserSettings } from "@/lib/types";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error("Missing Supabase environment variables");
}

// Create a secure Supabase client for server-side operations
export async function createSecureServerClient() {
  const session = await auth();
  
  if (!session?.userId) {
    throw new Error("Unauthorized: No user session");
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  // Return client with user context
  return {
    supabase,
    userId: session.userId,
  };
}

/**
 * Secure query builders that automatically filter by user ID
 */
export const secureQueries = {
  userSettings: {
    async get(userId: string) {
      const { supabase } = await createSecureServerClient();
      return supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", userId)
        .single();
    },

    async upsert(userId: string, data: Partial<Omit<UserSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) {
      const { supabase } = await createSecureServerClient();
      return supabase
        .from("user_settings")
        .upsert({
          ...data,
          user_id: userId,
        });
    },
  },

  mealLogs: {
    async getByUser(userId: string, filters?: { start_date?: Date; end_date?: Date }) {
      const { supabase } = await createSecureServerClient();
      let query = supabase
        .from("meal_logs")
        .select("*, food:foods(*)")
        .eq("user_id", userId);

      if (filters?.startDate) {
        query = query.gte("logged_at", filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte("logged_at", filters.endDate);
      }

      return query.order("logged_at", { ascending: false });
    },

    async insert(userId: string, data: { food_id: string; portion_size_g: number; vitamin_k_consumed_mcg: number }) {
      const { supabase } = await createSecureServerClient();
      
      // Get food to calculate vitamin K
      const { data: food, error: foodError } = await supabase
        .from("foods")
        .select("vitamin_k_mcg_per_100g")
        .eq("id", data.food_id)
        .single();

      if (foodError) throw new Error("Food not found");

      const vitamin_k_consumed_mcg = (data.portion_size_g / 100) * food.vitamin_k_mcg_per_100g;

      return supabase
        .from("meal_logs")
        .insert({
          user_id: userId,
          food_id: data.food_id,
          portion_size_g: data.portion_size_g,
          vitamin_k_consumed_mcg,
        })
        .select()
        .single();
    },

    async delete(userId: string, mealId: string) {
      const { supabase } = await createSecureServerClient();
      
      // First verify the meal belongs to the user
      const { data: meal } = await supabase
        .from("meal_logs")
        .select("user_id")
        .eq("id", mealId)
        .single();

      if (!meal || meal.user_id !== userId) {
        throw new Error("Unauthorized");
      }

      return supabase
        .from("meal_logs")
        .delete()
        .eq("id", mealId)
        .eq("user_id", userId);
    },
  },

  foods: {
    async search(query: string) {
      const { supabase } = await createSecureServerClient();
      return supabase
        .from("foods")
        .select("*")
        .textSearch("name", query, {
          type: "websearch",
          config: "english",
        })
        .limit(20);
    },

    async getById(id: string) {
      const { supabase } = await createSecureServerClient();
      return supabase
        .from("foods")
        .select("*")
        .eq("id", id)
        .single();
    },
  },
};