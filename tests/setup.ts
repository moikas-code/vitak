import { vi, beforeEach, afterEach } from "vitest";

// Mock Next.js modules
vi.mock("next/headers", () => ({
  headers: vi.fn(() => new Headers()),
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
  })),
}));

// Mock Clerk server module
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: null, sessionId: null }),
}));

// Mock Cloudflare context
vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: vi.fn(() => ({
    env: {
      DB: {},
      RATE_LIMIT_KV: {},
    },
  })),
}));

// Mock better-sqlite3 for local dev
vi.mock("better-sqlite3", () => ({
  default: vi.fn(() => ({
    prepare: vi.fn(() => ({
      run: vi.fn(),
      get: vi.fn(),
      all: vi.fn(),
    })),
    exec: vi.fn(),
    close: vi.fn(),
  })),
}));

// Mock drizzle-orm/better-sqlite3
vi.mock("drizzle-orm/better-sqlite3", () => ({
  drizzle: vi.fn(() => ({})),
}));

// Mock drizzle-orm/d1
vi.mock("drizzle-orm/d1", () => ({
  drizzle: vi.fn(() => ({})),
}));

// Suppress console output during tests
const originalConsole = { ...console };
beforeEach(() => {
  // Keep console.error for debugging
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});