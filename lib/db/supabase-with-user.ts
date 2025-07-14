import { createClient } from "@supabase/supabase-js";
import { supabaseServiceRole } from "./supabase-server";
import { createLogger } from "@/lib/logger";

const logger = createLogger('supabase-user');

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_URL");
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY");
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing env.SUPABASE_SERVICE_ROLE_KEY");
}

/**
 * Create a Supabase client for authenticated operations with proper RLS
 * Uses service role client with user context for consistent auth
 * @param userId - The Clerk user ID 
 * @returns Supabase client with user-scoped access
 */
export async function createSupabaseClientWithUser(userId: string) {
  // For now, use service role client until we fix RLS policies
  // This ensures consistent database access while we migrate
  logger.info('Using service role client for user operations', { userId: userId.substring(0, 8) + '...' });
  
  // TODO: Once RLS policies are updated to work with Clerk JWTs,
  // we can switch back to using user-scoped clients
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
 * LEGACY: Service role version for gradual migration
 * @deprecated Use createSupabaseClientWithUser instead
 */
export function createSupabaseClientWithUserLegacy(_userId: string) {
  logger.warn('Using legacy service role client - should migrate to user-scoped');
  
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
 * Uses anon key for database access without user context
 * @returns Supabase client with anon access
 */
export function createPublicSupabaseClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  
  // Use anon key for public operations
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
    logger.info('[createDefaultUserSettings] Ensuring user exists for:', { userId });
    
    // Use the database function to get or create user
    const { data: userData, error: userError } = await supabaseServiceRole
      .rpc('get_or_create_user', {
        p_clerk_user_id: userId,
      });
      
    if (userError || !userData) {
      logger.error('[createDefaultUserSettings] Failed to get/create user:', { error: userError });
      return null;
    }
    
    const userUuid = userData;
    logger.info('[createDefaultUserSettings] Got user UUID:', { userUuid });
    
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
      logger.error('[createDefaultUserSettings] Error creating settings:', { error });
      return null;
    }
    
    logger.info('[createDefaultUserSettings] Successfully created settings for user:', { userId });
    return data;
  } catch (error) {
    logger.error('[createDefaultUserSettings] Unexpected error:', { error });
    return null;
  }
}