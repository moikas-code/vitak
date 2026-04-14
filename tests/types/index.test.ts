import { describe, it, expect } from "vitest";
import {
  food_category_schema,
  vitamin_k_period_schema,
  user_settings_schema,
  food_schema,
  meal_log_schema,
  credit_balance_schema,
  meal_preset_schema,
} from "@/lib/types/index";
import type { FoodCategory, VitaminKPeriod, UserRole } from "@/lib/types/index";

describe("food_category_schema", () => {
  it("should accept all valid food categories", () => {
    const validCategories = [
      "vegetables",
      "fruits",
      "proteins",
      "grains",
      "dairy",
      "fats_oils",
      "beverages",
      "other",
    ];

    for (const cat of validCategories) {
      expect(food_category_schema.safeParse(cat).success).toBe(true);
    }
  });

  it("should reject invalid food categories", () => {
    expect(food_category_schema.safeParse("invalid").success).toBe(false);
    expect(food_category_schema.safeParse("").success).toBe(false);
    expect(food_category_schema.safeParse("Vegetables").success).toBe(false); // case sensitive
  });

  it("should have 8 categories via schema enum values", () => {
    const options = (food_category_schema as any)._def.values;
    expect(options).toHaveLength(8);
  });
});

describe("vitamin_k_period_schema", () => {
  it("should accept all valid periods", () => {
    expect(vitamin_k_period_schema.safeParse("daily").success).toBe(true);
    expect(vitamin_k_period_schema.safeParse("weekly").success).toBe(true);
    expect(vitamin_k_period_schema.safeParse("monthly").success).toBe(true);
  });

  it("should reject invalid periods", () => {
    expect(vitamin_k_period_schema.safeParse("yearly").success).toBe(false);
    expect(vitamin_k_period_schema.safeParse("Daily").success).toBe(false);
  });
});

describe("food_schema", () => {
  const validFood = {
    id: "food-1",
    name: "Spinach",
    vitamin_k_mcg_per_100g: 483,
    category: "vegetables" as FoodCategory,
    common_portion_size_g: 100,
    common_portion_name: "cup",
    created_by: null,
    updated_by: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  it("should validate a valid food object", () => {
    const result = food_schema.safeParse(validFood);
    expect(result.success).toBe(true);
  });

  it("should reject food without required fields", () => {
    const { name, ...noName } = validFood;
    expect(food_schema.safeParse(noName).success).toBe(false);
  });

  it("should reject negative vitamin_k_mcg_per_100g", () => {
    const invalid = { ...validFood, vitamin_k_mcg_per_100g: -1 };
    expect(food_schema.safeParse(invalid).success).toBe(false);
  });

  it("should reject zero common_portion_size_g", () => {
    const invalid = { ...validFood, common_portion_size_g: 0 };
    expect(food_schema.safeParse(invalid).success).toBe(false);
  });

  it("should accept valid categories", () => {
    const categories: FoodCategory[] = ["vegetables", "fruits", "proteins", "grains", "dairy", "fats_oils", "beverages", "other"];
    for (const cat of categories) {
      const food = { ...validFood, category: cat };
      expect(food_schema.safeParse(food).success).toBe(true);
    }
  });
});

describe("meal_log_schema", () => {
  const validMealLog = {
    id: "log-1",
    user_id: "user-1",
    food_id: "food-1",
    portion_size_g: 150,
    vitamin_k_consumed_mcg: 725,
    logged_at: new Date(),
    created_at: new Date(),
  };

  it("should validate a valid meal log", () => {
    expect(meal_log_schema.safeParse(validMealLog).success).toBe(true);
  });

  it("should reject missing required fields", () => {
    const { food_id, ...noFoodId } = validMealLog;
    expect(meal_log_schema.safeParse(noFoodId).success).toBe(false);
  });

  it("should reject negative portion_size_g", () => {
    const invalid = { ...validMealLog, portion_size_g: -10 };
    expect(meal_log_schema.safeParse(invalid).success).toBe(false);
  });

  it("should reject negative vitamin_k_consumed_mcg", () => {
    const invalid = { ...validMealLog, vitamin_k_consumed_mcg: -5 };
    expect(meal_log_schema.safeParse(invalid).success).toBe(false);
  });
});

describe("credit_balance_schema", () => {
  const validBalance = {
    user_id: "user-1",
    period: "daily" as VitaminKPeriod,
    credits_used: 50,
    credits_limit: 100,
    period_start: new Date(),
    period_end: new Date(),
  };

  it("should validate a valid credit balance", () => {
    expect(credit_balance_schema.safeParse(validBalance).success).toBe(true);
  });

  it("should reject negative credits_used", () => {
    const invalid = { ...validBalance, credits_used: -1 };
    expect(credit_balance_schema.safeParse(invalid).success).toBe(false);
  });

  it("should reject zero credits_limit", () => {
    const invalid = { ...validBalance, credits_limit: 0 };
    expect(credit_balance_schema.safeParse(invalid).success).toBe(false);
  });

  it("should reject invalid period", () => {
    const invalid = { ...validBalance, period: "yearly" };
    expect(credit_balance_schema.safeParse(invalid).success).toBe(false);
  });
});

describe("meal_preset_schema", () => {
  const validPreset = {
    id: "preset-1",
    user_id: "user-1",
    name: "My Breakfast",
    food_id: "food-1",
    portion_size_g: 150,
    vitamin_k_mcg: 50,
    usage_count: 5,
    created_at: new Date(),
    updated_at: new Date(),
  };

  it("should validate a valid meal preset", () => {
    expect(meal_preset_schema.safeParse(validPreset).success).toBe(true);
  });

  it("should reject name exceeding 50 chars", () => {
    const invalid = { ...validPreset, name: "a".repeat(51) };
    expect(meal_preset_schema.safeParse(invalid).success).toBe(false);
  });

  it("should reject negative usage_count", () => {
    const invalid = { ...validPreset, usage_count: -1 };
    expect(meal_preset_schema.safeParse(invalid).success).toBe(false);
  });

  it("should reject negative portion_size_g", () => {
    const invalid = { ...validPreset, portion_size_g: -10 };
    expect(meal_preset_schema.safeParse(invalid).success).toBe(false);
  });

  it("should reject negative vitamin_k_mcg", () => {
    const invalid = { ...validPreset, vitamin_k_mcg: -5 };
    expect(meal_preset_schema.safeParse(invalid).success).toBe(false);
  });
});

describe("user_settings_schema", () => {
  const validSettings = {
    id: "settings-1",
    user_id: "user-1",
    daily_limit: 100,
    weekly_limit: 700,
    monthly_limit: 3000,
    tracking_period: "daily" as const,
    role: "user" as UserRole,
    created_at: new Date(),
    updated_at: new Date(),
  };

  it("should validate valid settings", () => {
    expect(user_settings_schema.safeParse(validSettings).success).toBe(true);
  });

  it("should reject negative limits", () => {
    expect(user_settings_schema.safeParse({ ...validSettings, daily_limit: -1 }).success).toBe(false);
    expect(user_settings_schema.safeParse({ ...validSettings, weekly_limit: -1 }).success).toBe(false);
    expect(user_settings_schema.safeParse({ ...validSettings, monthly_limit: -1 }).success).toBe(false);
  });

  it("should reject zero limits", () => {
    expect(user_settings_schema.safeParse({ ...validSettings, daily_limit: 0 }).success).toBe(false);
  });

  it("should accept admin role", () => {
    expect(user_settings_schema.safeParse({ ...validSettings, role: "admin" }).success).toBe(true);
  });

  it("should reject invalid role", () => {
    expect(user_settings_schema.safeParse({ ...validSettings, role: "superadmin" }).success).toBe(false);
  });
});