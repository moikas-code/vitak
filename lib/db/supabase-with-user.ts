import { createClient } from "@supabase/supabase-js";

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