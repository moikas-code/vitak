import { z } from "zod";

export const vitamin_k_period_schema = z.enum(["daily", "weekly", "monthly"]);
export type VitaminKPeriod = z.infer<typeof vitamin_k_period_schema>;

export const food_category_schema = z.enum([
  "vegetables",
  "fruits",
  "proteins",
  "grains",
  "dairy",
  "fats_oils",
  "beverages",
  "other",
]);
export type FoodCategory = z.infer<typeof food_category_schema>;

export const user_settings_schema = z.object({
  id: z.string(),
  user_id: z.string(),
  daily_limit: z.number().positive(),
  weekly_limit: z.number().positive(),
  monthly_limit: z.number().positive(),
  tracking_period: vitamin_k_period_schema,
  created_at: z.date(),
  updated_at: z.date(),
});
export type UserSettings = z.infer<typeof user_settings_schema>;

export const food_schema = z.object({
  id: z.string(),
  name: z.string(),
  vitamin_k_mcg_per_100g: z.number().nonnegative(),
  category: food_category_schema,
  common_portion_size_g: z.number().positive(),
  common_portion_name: z.string(),
  created_at: z.date(),
  updated_at: z.date(),
});
export type Food = z.infer<typeof food_schema>;

export const meal_log_schema = z.object({
  id: z.string(),
  user_id: z.string(),
  food_id: z.string(),
  portion_size_g: z.number().positive(),
  vitamin_k_consumed_mcg: z.number().nonnegative(),
  logged_at: z.date(),
  created_at: z.date(),
});
export type MealLog = z.infer<typeof meal_log_schema>;

// Type for meal logs with joined food data (used in queries with joins)
export type MealLogWithFood = MealLog & {
  food: Food | null;
};

export const credit_balance_schema = z.object({
  user_id: z.string(),
  period: vitamin_k_period_schema,
  credits_used: z.number().nonnegative(),
  credits_limit: z.number().positive(),
  period_start: z.date(),
  period_end: z.date(),
});
export type CreditBalance = z.infer<typeof credit_balance_schema>;