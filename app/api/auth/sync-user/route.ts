import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseServiceRole } from "@/lib/db/supabase-server";
import { withRateLimit, API_RATE_LIMITS } from "@/lib/api/rate-limit";
import { sanitizeEmail, sanitizeUsername, sanitizeText, sanitizeUrl } from "@/lib/security/sanitize";
import { createLogger } from "@/lib/logger";

const logger = createLogger('auth-sync');

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const session = await auth();
    
    if (!session?.userId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Apply rate limiting
    return await withRateLimit(
      req,
      session.userId,
      'auth_sync',
      API_RATE_LIMITS.AUTH_SYNC,
      async () => {

    // Parse request body
    const body = await req.json();
    const { clerk_user_id, email, username, first_name, last_name, image_url } = body;

    // Validate clerk_user_id matches authenticated user
    if (clerk_user_id !== session.userId) {
      return NextResponse.json(
        { error: "User ID mismatch" },
        { status: 403 }
      );
    }

    logger.info('Syncing user', { userId: clerk_user_id });

    // Sanitize user inputs
    const sanitizedData = {
      clerk_user_id, // Don't sanitize Clerk ID as it's system-generated
      email: sanitizeEmail(email),
      username: username ? sanitizeUsername(username) : null,
      first_name: first_name ? sanitizeText(first_name) : null,
      last_name: last_name ? sanitizeText(last_name) : null,
      image_url: image_url ? sanitizeUrl(image_url) : null,
      updated_at: new Date().toISOString(),
    };

    // Upsert user in database
    const { data: userData, error: userError } = await supabaseServiceRole
      .from("users")
      .upsert(sanitizedData, {
        onConflict: "clerk_user_id",
      })
      .select()
      .single();

    if (userError) {
      logger.error('Error upserting user', userError, { userId: clerk_user_id });
      return NextResponse.json(
        { error: "Failed to sync user", details: userError.message },
        { status: 500 }
      );
    }

    // Ensure user_settings exist
    const { data: settingsData, error: settingsError } = await supabaseServiceRole
      .from("user_settings")
      .select("*")
      .eq("user_id", clerk_user_id)
      .single();

    // Only create settings if they don't exist
    if (!settingsData && settingsError?.code === "PGRST116") {
      const { error: createSettingsError } = await supabaseServiceRole
        .from("user_settings")
        .insert({
          user_id: clerk_user_id,
          daily_limit: 100,
          weekly_limit: 700,
          monthly_limit: 3000,
          tracking_period: "daily",
        });

      if (createSettingsError) {
        logger.error('Error creating user settings', createSettingsError, { userId: clerk_user_id });
        // Don't fail the whole sync if settings creation fails
        // User can still use the app and settings will be created on first access
      } else {
        logger.info('Created default settings for user', { userId: clerk_user_id });
      }
    }

    logger.info('Successfully synced user', { userId: clerk_user_id });

    return NextResponse.json({
      success: true,
      user_id: userData.id,
      clerk_user_id: userData.clerk_user_id,
      message: "User synced successfully"
    });
      }
    );
  } catch (error) {
    logger.error('Unexpected error during sync', error);
    return NextResponse.json(
      { 
        error: "Unexpected error during sync", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}