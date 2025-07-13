#!/usr/bin/env bun
import { supabaseServiceRole } from "../lib/db/supabase-server";
import { clerkClient } from "@clerk/nextjs/server";

async function setAdminComplete() {
  const userId = process.argv[2];
  
  if (!userId) {
    console.error("Usage: bun run scripts/set-admin-complete.ts <clerk-user-id>");
    console.error("Example: bun run scripts/set-admin-complete.ts user_2abc123...");
    process.exit(1);
  }
  
  console.log(`Setting user ${userId} as admin...`);
  
  try {
    // 1. Update in Clerk publicMetadata
    console.log("1. Updating Clerk publicMetadata...");
    const clerk = await clerkClient();
    await clerk.users.updateUser(userId, {
      publicMetadata: {
        role: "admin"
      }
    });
    console.log("✅ Clerk metadata updated");
    
    // 2. Update in database
    console.log("2. Updating database role...");
    const { data, error } = await supabaseServiceRole
      .from("user_settings")
      .update({ role: "admin" })
      .eq("user_id", userId)
      .select();
    
    if (error) {
      console.error("Error setting admin role in database:", error);
      process.exit(1);
    }
    
    if (!data || data.length === 0) {
      console.error("User not found in database. Make sure the user has logged in at least once.");
      process.exit(1);
    }
    
    console.log("✅ Database role updated");
    console.log("\n✅ User successfully set as admin in both Clerk and database!");
    console.log("\nNote: The user may need to log out and log back in for changes to take effect.");
    
  } catch (error) {
    console.error("Error updating admin role:", error);
    process.exit(1);
  }
  
  process.exit(0);
}

setAdminComplete();