import { describe, it, expect } from "vitest";
import { mapFood, mapMealLog, mapMealPreset, mapUserSettings } from "@/lib/db/mappers";

// Test data matching Drizzle schema types
const mockFood = {
  id: "food-1",
  name: "Spinach",
  vitaminKMcgPer100g: 483,
  category: "vegetables" as const,
  commonPortionSizeG: 100,
  commonPortionName: "cup",
  createdBy: "user-1",
  updatedBy: null,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-02T00:00:00.000Z",
};

const mockMealLog = {
  id: "log-1",
  userId: "user-1",
  foodId: "food-1",
  portionSizeG: 150,
  vitaminKConsumedMcg: 725,
  loggedAt: "2024-01-15T12:00:00.000Z",
  createdAt: "2024-01-15T12:00:00.000Z",
};

const mockMealPreset = {
  id: "preset-1",
  userId: "user-1",
  name: "My Spinach Salad",
  foodId: "food-1",
  portionSizeG: 200,
  vitaminKMcg: 966,
  usageCount: 5,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-10T00:00:00.000Z",
};

const mockUserSettings = {
  id: "settings-1",
  userId: "user-1",
  userUuid: null,
  dailyLimit: 100,
  weeklyLimit: 700,
  monthlyLimit: 3000,
  trackingPeriod: "daily" as const,
  role: "user" as const,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

describe("mapFood", () => {
  it("should convert camelCase fields to snake_case", () => {
    const result = mapFood(mockFood);

    expect(result.id).toBe("food-1");
    expect(result.name).toBe("Spinach");
    expect(result.vitamin_k_mcg_per_100g).toBe(483);
    expect(result.category).toBe("vegetables");
    expect(result.common_portion_size_g).toBe(100);
    expect(result.common_portion_name).toBe("cup");
  });

  it("should convert dates from strings to Date objects", () => {
    const result = mapFood(mockFood);

    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it("should handle null createdBy/updatedBy", () => {
    const food = { ...mockFood, createdBy: null, updatedBy: null };
    const result = mapFood(food);

    expect(result.created_by).toBeNull();
    expect(result.updated_by).toBeNull();
  });

  it("should handle non-null createdBy/updatedBy", () => {
    const food = { ...mockFood, updatedBy: "admin-1" };
    const result = mapFood(food);

    expect(result.created_by).toBe("user-1");
    expect(result.updated_by).toBe("admin-1");
  });
});

describe("mapMealLog", () => {
  it("should convert camelCase fields to snake_case", () => {
    const result = mapMealLog(mockMealLog);

    expect(result.id).toBe("log-1");
    expect(result.user_id).toBe("user-1");
    expect(result.food_id).toBe("food-1");
    expect(result.portion_size_g).toBe(150);
    expect(result.vitamin_k_consumed_mcg).toBe(725);
  });

  it("should convert dates from strings to Date objects", () => {
    const result = mapMealLog(mockMealLog);

    expect(result.logged_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });
});

describe("mapMealPreset", () => {
  it("should convert camelCase fields to snake_case", () => {
    const result = mapMealPreset(mockMealPreset);

    expect(result.id).toBe("preset-1");
    expect(result.user_id).toBe("user-1");
    expect(result.name).toBe("My Spinach Salad");
    expect(result.food_id).toBe("food-1");
    expect(result.portion_size_g).toBe(200);
    expect(result.vitamin_k_mcg).toBe(966);
    expect(result.usage_count).toBe(5);
  });

  it("should convert dates from strings to Date objects", () => {
    const result = mapMealPreset(mockMealPreset);

    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });
});

describe("mapUserSettings", () => {
  it("should convert camelCase fields to snake_case", () => {
    const result = mapUserSettings(mockUserSettings);

    expect(result.id).toBe("settings-1");
    expect(result.user_id).toBe("user-1");
    expect(result.user_uuid).toBeNull();
    expect(result.daily_limit).toBe(100);
    expect(result.weekly_limit).toBe(700);
    expect(result.monthly_limit).toBe(3000);
    expect(result.tracking_period).toBe("daily");
    expect(result.role).toBe("user");
  });

  it("should convert dates from strings to Date objects", () => {
    const result = mapUserSettings(mockUserSettings);

    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it("should handle admin role", () => {
    const adminSettings = { ...mockUserSettings, role: "admin" as const };
    const result = mapUserSettings(adminSettings);

    expect(result.role).toBe("admin");
  });

  it("should handle non-null userUuid", () => {
    const settings = { ...mockUserSettings, userUuid: "uuid-123" };
    const result = mapUserSettings(settings);

    expect(result.user_uuid).toBe("uuid-123");
  });
});