import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseServiceRole } from "@/lib/db/supabase-server";

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

    console.log(`[Sync User] Syncing user: ${clerk_user_id}`);

    // Upsert user in database
    const { data: userData, error: userError } = await supabaseServiceRole
      .from("users")
      .upsert({
        clerk_user_id,
        email,
        username,
        first_name,
        last_name,
        image_url,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "clerk_user_id",
      })
      .select()
      .single();

    if (userError) {
      console.error("[Sync User] Error upserting user:", userError);
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
        console.error("[Sync User] Error creating user settings:", createSettingsError);
        // Don't fail the whole sync if settings creation fails
        // User can still use the app and settings will be created on first access
      } else {
        console.log(`[Sync User] Created default settings for user: ${clerk_user_id}`);
      }
    }

    console.log(`[Sync User] Successfully synced user: ${clerk_user_id}`);

    return NextResponse.json({
      success: true,
      user_id: userData.id,
      clerk_user_id: userData.clerk_user_id,
      message: "User synced successfully"
    });

  } catch (error) {
    console.error("[Sync User] Unexpected error:", error);
    return NextResponse.json(
      { 
        error: "Unexpected error during sync", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}