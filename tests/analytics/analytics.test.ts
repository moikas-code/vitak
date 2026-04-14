import { describe, it, expect, vi } from "vitest";

// Mock fetch for analytics
vi.mock("@/lib/logger", () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  })),
}));

describe("Analytics module", () => {
  it("should export the analytics module", async () => {
    const mod = await import("@/lib/analytics");
    expect(mod).toBeDefined();
  });
});