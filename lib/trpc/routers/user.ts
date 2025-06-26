import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { createServerSupabaseClient } from "@/lib/db/supabase-server";

export const userRouter = createTRPCRouter({
  getCurrentUser: protectedProcedure.query(async ({ ctx }) => {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("clerk_user_id", ctx.session.userId)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch user",
      });
    }

    return data;
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
      // Security check: ensure the clerk_user_id matches the authenticated user
      if (input.clerk_user_id !== ctx.session.userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot create or update user record for a different user",
        });
      }

      // Use the database function to get or create user
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase.rpc("get_or_create_user", {
        p_clerk_user_id: input.clerk_user_id,
        p_email: input.email,
        p_username: input.username,
        p_first_name: input.first_name,
        p_last_name: input.last_name,
        p_image_url: input.image_url,
      });

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to ensure user exists",
        });
      }

      return data;
    }),

  getSettings: protectedProcedure.query(async ({ ctx }) => {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", ctx.session.userId)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch user settings",
      });
    }

    // If no settings exist, create default ones
    if (!data) {
      const { data: newSettings, error: insertError } = await supabase
        .from("user_settings")
        .insert({
          user_id: ctx.session.userId,
          daily_limit: 100,
          weekly_limit: 700,
          monthly_limit: 3000,
          tracking_period: "daily",
        })
        .select()
        .single();

      if (insertError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create user settings",
        });
      }

      return {
        ...newSettings,
        created_at: new Date(newSettings.created_at),
        updated_at: new Date(newSettings.updated_at),
      };
    }

    return {
      ...data,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
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
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase
        .from("user_settings")
        .update({
          ...input,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", ctx.session.userId)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update user settings",
        });
      }

      return {
        ...data,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
      };
    }),
});