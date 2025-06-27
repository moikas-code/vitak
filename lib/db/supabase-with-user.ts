import { createClient } from "@supabase/supabase-js";
import { supabaseServiceRole } from "./supabase-server";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_URL");
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

/**
 * Create a Supabase client with a specific user ID for RLS context
 * This is used by tRPC procedures that already have the user ID from session
 * @param userId - The Clerk user ID to set for RLS policies
 * @returns Supabase client configured with the user's context
 */
export function createSupabaseClientWithUser(userId: string) {
  // Create client with custom headers for RLS
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          // Pass the user ID for RLS policies
          "x-clerk-user-id": userId,
        },
      },
    }
  );

  return supabase;
}

/**
 * Create default user settings using service role client
 * This is only used when settings don't exist for a user
 * @param userId - The Clerk user ID
 * @returns The created settings or null if error
 */
export async function createDefaultUserSettings(userId: string) {
  try {
    // First, ensure the user exists in the users table and get their UUID
    console.log('[createDefaultUserSettings] Ensuring user exists for:', userId);
    
    // Use the database function to get or create user
    const { data: userData, error: userError } = await supabaseServiceRole
      .rpc('get_or_create_user', {
        p_clerk_user_id: userId,
      });
      
    if (userError || !userData) {
      console.error('[createDefaultUserSettings] Failed to get/create user:', userError);
      return null;
    }
    
    const userUuid = userData;
    console.log('[createDefaultUserSettings] Got user UUID:', userUuid);
    
    // Now create the settings with both user_id and user_uuid
    const default_settings = {
      user_id: userId,
      user_uuid: userUuid,
      daily_limit: 100,
      weekly_limit: 700,
      monthly_limit: 3000,
      tracking_period: 'daily' as const,
    };
    
    const { data, error } = await supabaseServiceRole
      .from("user_settings")
      .insert(default_settings)
      .select("daily_limit, weekly_limit, monthly_limit")
      .single();
      
    if (error) {
      console.error('[createDefaultUserSettings] Error creating settings:', error);
      return null;
    }
    
    console.log('[createDefaultUserSettings] Successfully created settings for user:', userId);
    return data;
  } catch (error) {
    console.error('[createDefaultUserSettings] Unexpected error:', error);
    return null;
  }
}