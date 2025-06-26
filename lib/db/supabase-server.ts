import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_URL");
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing env.SUPABASE_SERVICE_ROLE_KEY");
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

/**
 * Create a Supabase client for server-side use with Clerk authentication
 * This properly sets the user context for Row Level Security
 */
export async function createServerSupabaseClient() {
  const session = await auth();
  
  if (!session?.userId) {
    throw new Error("Unauthorized");
  }

  // Create client with custom auth
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
          // Pass the Clerk user ID for RLS policies
          "x-clerk-user-id": session.userId,
        },
      },
    }
  );

  // The x-clerk-user-id header will be used by RLS policies
  // No need for set_current_user RPC call
  return supabase;
}

/**
 * Admin client for system operations only (webhooks, migrations)
 * NEVER use this in user-facing code
 */
export const supabaseServiceRole = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);