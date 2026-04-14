import { describe, it, expect } from "vitest";
import {
  RATE_LIMITS,
  VITAMIN_K_THRESHOLDS,
  DEFAULT_USER_SETTINGS,
  API_CONFIG,
  TIME_CONFIG,
  VALIDATION_PATTERNS,
  PWA_CONFIG,
  FEATURES,
  getVitaminKColor,
  getVitaminKLevel,
} from "@/lib/config/constants";

describe("Constants", () => {
  describe("RATE_LIMITS", () => {
    it("should have correct search config", () => {
      expect(RATE_LIMITS.SEARCH_DEBOUNCE_MS).toBe(300);
      expect(RATE_LIMITS.SEARCH_MIN_LENGTH).toBe(2);
      expect(RATE_LIMITS.SEARCH_MAX_LENGTH).toBe(100);
      expect(RATE_LIMITS.FEEDBACK_MAX_LENGTH).toBe(500);
      expect(RATE_LIMITS.PRESET_NAME_MAX_LENGTH).toBe(50);
    });
  });

  describe("VITAMIN_K_THRESHOLDS", () => {
    it("should have HIGH > MEDIUM > LOW", () => {
      expect(VITAMIN_K_THRESHOLDS.HIGH).toBeGreaterThan(VITAMIN_K_THRESHOLDS.MEDIUM);
      expect(VITAMIN_K_THRESHOLDS.MEDIUM).toBeGreaterThan(VITAMIN_K_THRESHOLDS.LOW);
    });

    it("should have specific threshold values", () => {
      expect(VITAMIN_K_THRESHOLDS.HIGH).toBe(50);
      expect(VITAMIN_K_THRESHOLDS.MEDIUM).toBe(20);
      expect(VITAMIN_K_THRESHOLDS.LOW).toBe(0);
    });
  });

  describe("DEFAULT_USER_SETTINGS", () => {
    it("should have reasonable daily/weekly/monthly defaults", () => {
      expect(DEFAULT_USER_SETTINGS.DAILY_LIMIT).toBe(100);
      expect(DEFAULT_USER_SETTINGS.WEEKLY_LIMIT).toBe(700);
      expect(DEFAULT_USER_SETTINGS.MONTHLY_LIMIT).toBe(3000);
      expect(DEFAULT_USER_SETTINGS.TRACKING_PERIOD).toBe("daily");
    });

    it("should have weekly > daily * 7", () => {
      expect(DEFAULT_USER_SETTINGS.WEEKLY_LIMIT).toBeGreaterThanOrEqual(
        DEFAULT_USER_SETTINGS.DAILY_LIMIT * 7
      );
    });

    it("should have monthly > weekly * 4", () => {
      expect(DEFAULT_USER_SETTINGS.MONTHLY_LIMIT).toBeGreaterThanOrEqual(
        DEFAULT_USER_SETTINGS.WEEKLY_LIMIT * 4
      );
    });
  });

  describe("API_CONFIG", () => {
    it("should have reasonable limits", () => {
      expect(API_CONFIG.FOODS_SEARCH_LIMIT).toBeGreaterThan(0);
      expect(API_CONFIG.FOODS_SEARCH_LIMIT).toBeLessThanOrEqual(100);
      expect(API_CONFIG.RECENT_MEALS_LIMIT).toBeGreaterThan(0);
    });
  });

  describe("TIME_CONFIG", () => {
    it("should have positive durations", () => {
      expect(TIME_CONFIG.TOAST_DURATION).toBeGreaterThan(0);
      expect(TIME_CONFIG.SESSION_TIMEOUT).toBeGreaterThan(0);
      expect(TIME_CONFIG.CACHE_DURATION).toBeGreaterThan(0);
    });
  });

  describe("VALIDATION_PATTERNS", () => {
    it("should match valid emails", () => {
      expect(VALIDATION_PATTERNS.EMAIL.test("user@example.com")).toBe(true);
    });

    it("should reject invalid emails", () => {
      expect(VALIDATION_PATTERNS.EMAIL.test("not-email")).toBe(false);
    });

    it("should match valid UUIDs", () => {
      expect(VALIDATION_PATTERNS.UUID.test("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
    });

    it("should reject invalid UUIDs", () => {
      expect(VALIDATION_PATTERNS.UUID.test("not-a-uuid")).toBe(false);
    });
  });

  describe("FEATURES", () => {
    it("should have all feature flags", () => {
      expect(FEATURES.OFFLINE_MODE).toBe(true);
      expect(FEATURES.ANALYTICS).toBe(true);
      expect(FEATURES.FEEDBACK).toBe(true);
      expect(FEATURES.DONATIONS).toBe(true);
      expect(FEATURES.MEAL_PRESETS).toBe(true);
    });
  });
});

describe("getVitaminKColor", () => {
  it("should return red for high vitamin K (>50)", () => {
    expect(getVitaminKColor(51)).toBe("text-red-600");
    expect(getVitaminKColor(100)).toBe("text-red-600");
    expect(getVitaminKColor(500)).toBe("text-red-600");
  });

  it("should return yellow for medium vitamin K (21-50)", () => {
    expect(getVitaminKColor(21)).toBe("text-yellow-600");
    expect(getVitaminKColor(30)).toBe("text-yellow-600");
    expect(getVitaminKColor(50)).toBe("text-yellow-600");
  });

  it("should return green for low vitamin K (0-20)", () => {
    expect(getVitaminKColor(0)).toBe("text-green-600");
    expect(getVitaminKColor(10)).toBe("text-green-600");
    expect(getVitaminKColor(20)).toBe("text-green-600");
  });
});

describe("getVitaminKLevel", () => {
  it("should return 'high' for values > 50", () => {
    expect(getVitaminKLevel(51)).toBe("high");
    expect(getVitaminKLevel(100)).toBe("high");
  });

  it("should return 'medium' for values 21-50", () => {
    expect(getVitaminKLevel(21)).toBe("medium");
    expect(getVitaminKLevel(50)).toBe("medium");
  });

  it("should return 'low' for values 0-20", () => {
    expect(getVitaminKLevel(0)).toBe("low");
    expect(getVitaminKLevel(20)).toBe("low");
  });

  it("should handle exact boundary values", () => {
    expect(getVitaminKLevel(50)).toBe("medium");
    expect(getVitaminKLevel(20)).toBe("low");
    expect(getVitaminKLevel(0)).toBe("low");
  });
});