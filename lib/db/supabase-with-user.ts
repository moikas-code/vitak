import { createClient } from "@supabase/supabase-js";
import { supabaseServiceRole } from "./supabase-server";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_URL");
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing env.SUPABASE_SERVICE_ROLE_KEY");
}

/**
 * Create a Supabase client for authenticated operations
 * Uses service role key since we handle authentication at the tRPC layer
 * @param _userId - The Clerk user ID (kept for compatibility, not used with service role)
 * @returns Supabase client with service role access
 */
export function createSupabaseClientWithUser(_userId: string) {
  // Use service role key since we enforce security at the application layer
  // This bypasses RLS which isn't properly integrated with Clerk
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  return supabase;
}

/**
 * Create a Supabase client for public/unauthenticated operations
 * Uses service role key for database access without user context
 * @returns Supabase client with service role access
 */
export function createPublicSupabaseClient() {
  // Use service role key for public operations
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
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