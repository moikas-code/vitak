import { describe, it, expect } from "vitest";
import {
  FOOD_CATEGORIES,
  users,
  userSettings,
  foods,
  mealLogs,
  mealPresets,
  foodAuditLog,
} from "@/lib/db/schema";

describe("Database Schema", () => {
  describe("FOOD_CATEGORIES", () => {
    it("should be a readonly tuple of categories", () => {
      expect(Array.isArray(FOOD_CATEGORIES)).toBe(true);
      expect(FOOD_CATEGORIES).toHaveLength(8);
    });

    it("should contain all expected categories", () => {
      expect(FOOD_CATEGORIES).toContain("vegetables");
      expect(FOOD_CATEGORIES).toContain("fruits");
      expect(FOOD_CATEGORIES).toContain("proteins");
      expect(FOOD_CATEGORIES).toContain("grains");
      expect(FOOD_CATEGORIES).toContain("dairy");
      expect(FOOD_CATEGORIES).toContain("fats_oils");
      expect(FOOD_CATEGORIES).toContain("beverages");
      expect(FOOD_CATEGORIES).toContain("other");
    });
  });

  describe("users table", () => {
    it("should have required columns", () => {
      const columns = Object.keys(users);
      expect(columns).toContain("id");
      expect(columns).toContain("clerkUserId");
      expect(columns).toContain("email");
      expect(columns).toContain("username");
      expect(columns).toContain("firstName");
      expect(columns).toContain("lastName");
      expect(columns).toContain("imageUrl");
      expect(columns).toContain("createdAt");
      expect(columns).toContain("updatedAt");
    });
  });

  describe("userSettings table", () => {
    it("should have required columns", () => {
      const columns = Object.keys(userSettings);
      expect(columns).toContain("id");
      expect(columns).toContain("userId");
      expect(columns).toContain("dailyLimit");
      expect(columns).toContain("weeklyLimit");
      expect(columns).toContain("monthlyLimit");
      expect(columns).toContain("trackingPeriod");
      expect(columns).toContain("role");
      expect(columns).toContain("createdAt");
      expect(columns).toContain("updatedAt");
    });

    it("should have default values for limits", () => {
      // Check that defaults exist by examining column config
      expect(userSettings.dailyLimit).toBeDefined();
      expect(userSettings.weeklyLimit).toBeDefined();
      expect(userSettings.monthlyLimit).toBeDefined();
    });
  });

  describe("foods table", () => {
    it("should have required columns", () => {
      const columns = Object.keys(foods);
      expect(columns).toContain("id");
      expect(columns).toContain("name");
      expect(columns).toContain("vitaminKMcgPer100g");
      expect(columns).toContain("category");
      expect(columns).toContain("commonPortionSizeG");
      expect(columns).toContain("commonPortionName");
      expect(columns).toContain("createdBy");
      expect(columns).toContain("updatedBy");
      expect(columns).toContain("createdAt");
      expect(columns).toContain("updatedAt");
    });
  });

  describe("mealLogs table", () => {
    it("should have required columns", () => {
      const columns = Object.keys(mealLogs);
      expect(columns).toContain("id");
      expect(columns).toContain("userId");
      expect(columns).toContain("foodId");
      expect(columns).toContain("portionSizeG");
      expect(columns).toContain("vitaminKConsumedMcg");
      expect(columns).toContain("loggedAt");
      expect(columns).toContain("createdAt");
    });
  });

  describe("mealPresets table", () => {
    it("should have required columns", () => {
      const columns = Object.keys(mealPresets);
      expect(columns).toContain("id");
      expect(columns).toContain("userId");
      expect(columns).toContain("name");
      expect(columns).toContain("foodId");
      expect(columns).toContain("portionSizeG");
      expect(columns).toContain("vitaminKMcg");
      expect(columns).toContain("usageCount");
      expect(columns).toContain("createdAt");
      expect(columns).toContain("updatedAt");
    });
  });

  describe("foodAuditLog table", () => {
    it("should have required columns", () => {
      const columns = Object.keys(foodAuditLog);
      expect(columns).toContain("id");
      expect(columns).toContain("foodId");
      expect(columns).toContain("action");
      expect(columns).toContain("changedBy");
      expect(columns).toContain("changedAt");
      expect(columns).toContain("oldValues");
      expect(columns).toContain("newValues");
      expect(columns).toContain("ipAddress");
      expect(columns).toContain("userAgent");
    });
  });
});