import { describe, it, expect, vi } from "vitest";

// Mock environment and Clerk before importing
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: null, sessionId: null }),
}));

vi.mock("@/lib/db", () => ({
  getDb: vi.fn().mockResolvedValue({}),
  getServiceDb: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/db/schema", () => ({
  userSettings: {
    userId: "userId",
    role: "role",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
}));

describe("tRPC Context", () => {
  it("should export createTRPCContext function", async () => {
    const { createTRPCContext } = await import("@/lib/trpc/trpc");
    expect(typeof createTRPCContext).toBe("function");
  });

  it("should export createTRPCRouter", async () => {
    const { createTRPCRouter } = await import("@/lib/trpc/trpc");
    expect(typeof createTRPCRouter).toBe("function");
  });

  it("should export protectedProcedure", async () => {
    const { protectedProcedure } = await import("@/lib/trpc/trpc");
    expect(protectedProcedure).toBeDefined();
  });

  it("should export adminProcedure", async () => {
    const { adminProcedure } = await import("@/lib/trpc/trpc");
    expect(adminProcedure).toBeDefined();
  });

  it("should export publicProcedure", async () => {
    const { publicProcedure } = await import("@/lib/trpc/trpc");
    expect(publicProcedure).toBeDefined();
  });
});

describe("tRPC Root Router", () => {
  it("should export appRouter", async () => {
    const { appRouter } = await import("@/lib/trpc/root");
    expect(appRouter).toBeDefined();
  });

  it("should export AppRouter type", async () => {
    const mod = await import("@/lib/trpc/root");
    // Type export is compile-time only, but the module should load
    expect(mod).toBeDefined();
  });

  it("should export createCaller", async () => {
    const { createCaller } = await import("@/lib/trpc/root");
    expect(typeof createCaller).toBe("function");
  });
});

describe("tRPC Routers", () => {
  it("should export foodRouter", async () => {
    const { foodRouter } = await import("@/lib/trpc/routers/food");
    expect(foodRouter).toBeDefined();
  });

  it("should export mealLogRouter", async () => {
    const { mealLogRouter } = await import("@/lib/trpc/routers/meal-log");
    expect(mealLogRouter).toBeDefined();
  });

  it("should export creditRouter", async () => {
    const { creditRouter } = await import("@/lib/trpc/routers/credit");
    expect(creditRouter).toBeDefined();
  });

  it("should export userRouter", async () => {
    const { userRouter } = await import("@/lib/trpc/routers/user");
    expect(userRouter).toBeDefined();
  });

  it("should export mealPresetRouter", async () => {
    const { mealPresetRouter } = await import("@/lib/trpc/routers/meal-preset");
    expect(mealPresetRouter).toBeDefined();
  });

  it("should export adminRouter", async () => {
    const { adminRouter } = await import("@/lib/trpc/routers/admin");
    expect(adminRouter).toBeDefined();
  });
});