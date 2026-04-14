import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { getDb } from "@/lib/db";
import { userSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const userRouter = createTRPCRouter({
  getCurrentUser: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const user = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, ctx.session.userId))
      .get();

    // If we have a settings record, return it
    // The "users" table is a Clerk concept — we don't need a separate DB row
    return user || null;
  }),

  ensureUserExists: protectedProcedure
    .input(
      z.object({
        clerk_user_id: z.string(),
        email: z.string().email().nullable(),
        username: z.string().nullable(),
        first_name: z.string().nullable(),
        last_name: z.string().nullable(),
        image_url: z.string().url().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.clerk_user_id !== ctx.session.userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot create or update user record for a different user",
        });
      }

      const db = await getDb();

      // Ensure settings exist — upsert via insert-or-ignore + update
      const existing = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, input.clerk_user_id))
        .get();

      if (!existing) {
        await db.insert(userSettings).values({
          userId: input.clerk_user_id,
          dailyLimit: 100,
          weeklyLimit: 700,
          monthlyLimit: 3000,
          trackingPeriod: "daily",
          role: "user",
        });
      }

      return { success: true, userId: input.clerk_user_id };
    }),

  getSettings: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    let settings = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, ctx.session.userId))
      .get();

    if (!settings) {
      // Create default settings
      await db.insert(userSettings).values({
        userId: ctx.session.userId,
        dailyLimit: 100,
        weeklyLimit: 700,
        monthlyLimit: 3000,
        trackingPeriod: "daily",
        role: "user",
      });

      settings = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, ctx.session.userId))
        .get();
    }

    if (!settings) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create user settings",
      });
    }

    return {
      ...settings,
      user_id: settings.userId,
      daily_limit: settings.dailyLimit,
      weekly_limit: settings.weeklyLimit,
      monthly_limit: settings.monthlyLimit,
      tracking_period: settings.trackingPeriod,
      created_at: new Date(settings.createdAt),
      updated_at: new Date(settings.updatedAt),
    };
  }),

  updateSettings: protectedProcedure
    .input(
      z.object({
        daily_limit: z.number().positive().optional(),
        weekly_limit: z.number().positive().optional(),
        monthly_limit: z.number().positive().optional(),
        tracking_period: z.enum(["daily", "weekly", "monthly"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      const updateData: Record<string, unknown> = {};
      if (input.daily_limit !== undefined) updateData["dailyLimit"] = input.daily_limit;
      if (input.weekly_limit !== undefined) updateData["weeklyLimit"] = input.weekly_limit;
      if (input.monthly_limit !== undefined) updateData["monthlyLimit"] = input.monthly_limit;
      if (input.tracking_period !== undefined) updateData["trackingPeriod"] = input.tracking_period;

      const [updated] = await db
        .update(userSettings)
        .set(updateData)
        .where(eq(userSettings.userId, ctx.session.userId))
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update user settings",
        });
      }

      return {
        ...updated,
        user_id: updated.userId,
        daily_limit: updated.dailyLimit,
        weekly_limit: updated.weeklyLimit,
        monthly_limit: updated.monthlyLimit,
        tracking_period: updated.trackingPeriod,
        created_at: new Date(updated.createdAt),
        updated_at: new Date(updated.updatedAt),
      };
    }),
});