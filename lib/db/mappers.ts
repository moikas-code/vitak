/**
 * Map Drizzle camelCase rows to snake_case for client compatibility.
 * The frontend expects Supabase-style snake_case field names.
 */

import type { Food as SchemaFood, MealLog as SchemaMealLog, MealPreset as SchemaMealPreset, UserSettings as SchemaUserSettings } from "@/lib/db/schema";

// ─── Food ──────────────────────────────────────────────────────────
export interface FoodRow {
  id: string;
  name: string;
  vitamin_k_mcg_per_100g: number;
  category: string;
  common_portion_size_g: number;
  common_portion_name: string;
  created_by: string | null;
  updated_by: string | null;
  created_at: Date;
  updated_at: Date;
}

export function mapFood(f: SchemaFood): FoodRow {
  return {
    id: f.id,
    name: f.name,
    vitamin_k_mcg_per_100g: f.vitaminKMcgPer100g,
    category: f.category,
    common_portion_size_g: f.commonPortionSizeG,
    common_portion_name: f.commonPortionName,
    created_by: f.createdBy ?? null,
    updated_by: f.updatedBy ?? null,
    created_at: new Date(f.createdAt),
    updated_at: new Date(f.updatedAt),
  };
}

// ─── Meal Log ───────────────────────────────────────────────────────
export interface MealLogRow {
  id: string;
  user_id: string;
  food_id: string;
  portion_size_g: number;
  vitamin_k_consumed_mcg: number;
  logged_at: Date;
  created_at: Date;
}

export function mapMealLog(m: SchemaMealLog): MealLogRow {
  return {
    id: m.id,
    user_id: m.userId,
    food_id: m.foodId,
    portion_size_g: m.portionSizeG,
    vitamin_k_consumed_mcg: m.vitaminKConsumedMcg,
    logged_at: new Date(m.loggedAt),
    created_at: new Date(m.createdAt),
  };
}

// ─── Meal Log with Food ─────────────────────────────────────────────
export interface MealLogWithFoodRow extends MealLogRow {
  food: FoodRow | null;
}

// ─── Meal Preset ────────────────────────────────────────────────────
export interface MealPresetRow {
  id: string;
  user_id: string;
  name: string;
  food_id: string;
  portion_size_g: number;
  vitamin_k_mcg: number;
  usage_count: number;
  created_at: Date;
  updated_at: Date;
  food?: FoodRow | null;
}

export function mapMealPreset(p: SchemaMealPreset): MealPresetRow {
  return {
    id: p.id,
    user_id: p.userId,
    name: p.name,
    food_id: p.foodId,
    portion_size_g: p.portionSizeG,
    vitamin_k_mcg: p.vitaminKMcg,
    usage_count: p.usageCount,
    created_at: new Date(p.createdAt),
    updated_at: new Date(p.updatedAt),
  };
}

// ─── User Settings ──────────────────────────────────────────────────
export interface UserSettingsRow {
  id: string;
  user_id: string;
  user_uuid: string | null;
  daily_limit: number;
  weekly_limit: number;
  monthly_limit: number;
  tracking_period: "daily" | "weekly" | "monthly";
  role: "user" | "admin";
  created_at: Date;
  updated_at: Date;
}

export function mapUserSettings(s: SchemaUserSettings): UserSettingsRow {
  return {
    id: s.id,
    user_id: s.userId,
    user_uuid: s.userUuid ?? null,
    daily_limit: s.dailyLimit,
    weekly_limit: s.weeklyLimit,
    monthly_limit: s.monthlyLimit,
    tracking_period: s.trackingPeriod,
    role: s.role,
    created_at: new Date(s.createdAt),
    updated_at: new Date(s.updatedAt),
  };
}