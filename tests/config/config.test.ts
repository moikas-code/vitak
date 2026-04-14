import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Clerk auth
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: null, sessionId: null }),
}));

// Mock the DB
vi.mock("@/lib/db", () => ({
  getDb: vi.fn().mockResolvedValue({}),
}));

import { OFFLINE_CONFIG, RATE_LIMIT_CONFIG, API_CONFIG, SECURITY_CONFIG, FEATURES, getConfig } from "@/lib/config";

describe("Config module", () => {
  describe("OFFLINE_CONFIG", () => {
    it("should have sync interval configuration", () => {
      expect(OFFLINE_CONFIG.SYNC_INTERVAL_MS).toBe(30000);
      expect(OFFLINE_CONFIG.SYNC_RETRY_COUNT).toBe(3);
      expect(OFFLINE_CONFIG.SYNC_RETRY_DELAY_MS).toBe(5000);
    });

    it("should have token expiry configuration", () => {
      expect(OFFLINE_CONFIG.TOKEN_EXPIRY_MS).toBe(3600000); // 1 hour
      expect(OFFLINE_CONFIG.TOKEN_REFRESH_INTERVAL_MS).toBe(300000); // 5 min
    });

    it("should have encryption configuration", () => {
      expect(OFFLINE_CONFIG.ENCRYPTION_ITERATIONS).toBe(100000);
      expect(OFFLINE_CONFIG.ENCRYPTION_SALT_LENGTH).toBe(16);
      expect(OFFLINE_CONFIG.ENCRYPTION_IV_LENGTH).toBe(12);
    });

    it("should have database configuration", () => {
      expect(OFFLINE_CONFIG.DB_NAME).toBe("vitak-offline-db");
      expect(OFFLINE_CONFIG.DB_VERSION).toBeGreaterThanOrEqual(2);
    });
  });

  describe("RATE_LIMIT_CONFIG", () => {
    it("should have cleanup interval", () => {
      expect(RATE_LIMIT_CONFIG.CLEANUP_INTERVAL_MS).toBe(300000);
    });
  });

  describe("API_CONFIG", () => {
    it("should have timeout configurations", () => {
      expect(API_CONFIG.DEFAULT_TIMEOUT_MS).toBe(30000);
      expect(API_CONFIG.UPLOAD_TIMEOUT_MS).toBe(60000);
    });

    it("should have retry configuration", () => {
      expect(API_CONFIG.MAX_RETRIES).toBe(3);
      expect(API_CONFIG.RETRY_DELAY_MS).toBe(1000);
    });
  });

  describe("SECURITY_CONFIG", () => {
    it("should have session configuration", () => {
      expect(SECURITY_CONFIG.SESSION_TIMEOUT_MS).toBe(1800000);
      expect(SECURITY_CONFIG.SESSION_EXTEND_THRESHOLD_MS).toBe(300000);
    });
  });

  describe("FEATURES", () => {
    it("should have all feature flags enabled", () => {
      expect(FEATURES.OFFLINE_MODE).toBe(true);
      expect(FEATURES.OFFLINE_SYNC).toBe(true);
      expect(FEATURES.OFFLINE_ENCRYPTION).toBe(true);
      expect(FEATURES.RATE_LIMITING).toBe(true);
      expect(FEATURES.TOKEN_ENCRYPTION).toBe(true);
    });

    it("should have debug flags disabled", () => {
      // In test/dev env, DEBUG_LOGGING depends on NODE_ENV
      expect(FEATURES.DEBUG_ENDPOINTS).toBe(false);
    });
  });

  describe("getConfig", () => {
    it("should return config with overrides", () => {
      const base = { a: 1, b: 2 } as const;
      const result = getConfig(base, { b: 3 as const });
      expect(result.b).toBe(3);
      expect(result.a).toBe(1);
    });

    it("should return config without overrides", () => {
      const base = { a: 1, b: 2 } as const;
      const result = getConfig(base);
      expect(result).toEqual({ a: 1, b: 2 });
    });
  });
});