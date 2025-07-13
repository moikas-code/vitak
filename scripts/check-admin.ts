#!/usr/bin/env bun
import { clerkClient } from "@clerk/nextjs/server";
import { supabaseServiceRole } from "../lib/db/supabase-server";

async function checkAdmin() {
  const userId = process.argv[2];
  
  if (!userId) {
    console.error("Usage: bun run scripts/check-admin.ts <clerk-user-id>");
    console.error("Example: bun run scripts/check-admin.ts user_2abc123...");
    process.exit(1);
  }
  
  console.log(`\nChecking admin status for user ${userId}...\n`);
  
  try {
    // 1. Check Clerk user
    console.log("1. Checking Clerk user...");
    const clerk = await clerkClient();
    const clerkUser = await clerk.users.getUser(userId);
    
    console.log("Clerk User Found:");
    console.log("- Email:", clerkUser.emailAddresses[0]?.emailAddress);
    console.log("- Public Metadata:", JSON.stringify(clerkUser.publicMetadata, null, 2));
    console.log("- Role in Clerk:", clerkUser.publicMetadata?.role || "NOT SET");
    
    // 2. Check database
    console.log("\n2. Checking database...");
    const { data: dbUser, error } = await supabaseServiceRole
      .from("user_settings")
      .select("user_id, role")
      .eq("user_id", userId)
      .single();
    
    if (error) {
      console.log("Database Error:", error.message);
    } else {
      console.log("Database User Found:");
      console.log("- User ID:", dbUser.user_id);
      console.log("- Role in DB:", dbUser.role);
    }
    
    // Summary
    console.log("\n========== SUMMARY ==========");
    console.log("Clerk Role:", clerkUser.publicMetadata?.role || "NOT SET");
    console.log("Database Role:", dbUser?.role || "NOT FOUND");
    
    if (clerkUser.publicMetadata?.role === 'admin' && dbUser?.role === 'admin') {
      console.log("\n✅ User has admin role in BOTH Clerk and database!");
    } else {
      console.log("\n❌ User does NOT have admin role in both places!");
      console.log("\nTo fix this, run:");
      console.log(`bun run scripts/set-admin-complete.ts ${userId}`);
    }
    
  } catch (error) {
    console.error("Error checking admin status:", error);
    process.exit(1);
  }
  
  process.exit(0);
}

checkAdmin();