#!/usr/bin/env bun
import { clerkClient } from "@clerk/nextjs/server";
import { supabaseServiceRole } from "../lib/db/supabase-server";

async function forceSetAdmin() {
  const userId = process.argv[2];
  
  if (!userId) {
    console.error("Usage: bun run scripts/force-set-admin.ts <clerk-user-id>");
    console.error("Example: bun run scripts/force-set-admin.ts user_2abc123...");
    process.exit(1);
  }
  
  console.log(`\n🔧 Force setting admin role for user ${userId}...\n`);
  
  try {
    // 1. Get current Clerk user to see metadata
    console.log("1. Fetching current Clerk user data...");
    const clerk = await clerkClient();
    let clerkUser = await clerk.users.getUser(userId);
    
    console.log("Current publicMetadata:", JSON.stringify(clerkUser.publicMetadata, null, 2));
    
    // 2. Force update Clerk publicMetadata
    console.log("\n2. Updating Clerk publicMetadata...");
    clerkUser = await clerk.users.updateUser(userId, {
      publicMetadata: {
        ...clerkUser.publicMetadata,
        role: "admin"
      }
    });
    
    console.log("✅ Clerk metadata updated!");
    console.log("New publicMetadata:", JSON.stringify(clerkUser.publicMetadata, null, 2));
    
    // 3. Update database
    console.log("\n3. Updating database role...");
    
    // First check if user exists
    const { data: existingUser } = await supabaseServiceRole
      .from("user_settings")
      .select("user_id, role")
      .eq("user_id", userId)
      .single();
    
    if (!existingUser) {
      console.log("User not found in database. Creating user_settings...");
      const { error: insertError } = await supabaseServiceRole
        .from("user_settings")
        .insert({
          user_id: userId,
          role: "admin",
          daily_limit: 100,
          weekly_limit: 700,
          monthly_limit: 3000,
          tracking_period: "daily"
        });
      
      if (insertError) {
        console.error("Error creating user_settings:", insertError);
      } else {
        console.log("✅ User settings created with admin role!");
      }
    } else {
      console.log("Current database role:", existingUser.role);
      
      const { error: updateError } = await supabaseServiceRole
        .from("user_settings")
        .update({ role: "admin" })
        .eq("user_id", userId);
      
      if (updateError) {
        console.error("Error updating role:", updateError);
      } else {
        console.log("✅ Database role updated to admin!");
      }
    }
    
    // 4. Verify the update
    console.log("\n4. Verifying updates...");
    const { data: verifyUser } = await supabaseServiceRole
      .from("user_settings")
      .select("user_id, role")
      .eq("user_id", userId)
      .single();
    
    console.log("Database verification:", verifyUser);
    
    console.log("\n✅ SUCCESS! Admin role has been set in both Clerk and database.");
    console.log("\n⚠️  IMPORTANT: You MUST:");
    console.log("1. Log out completely from the application");
    console.log("2. Clear your browser cookies for localhost:3000");
    console.log("3. Log back in");
    console.log("\nThe Clerk session needs to be refreshed to include the new metadata.");
    
  } catch (error) {
    console.error("\n❌ Error setting admin role:", error);
    process.exit(1);
  }
  
  process.exit(0);
}

forceSetAdmin();