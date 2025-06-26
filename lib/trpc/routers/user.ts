import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { supabaseAdmin } from "@/lib/db/supabase";

export const userRouter = createTRPCRouter({
  getSettings: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await supabaseAdmin
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
      const { data: newSettings, error: insertError } = await supabaseAdmin
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
      const { data, error } = await supabaseAdmin
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