#!/usr/bin/env bun
import { supabaseServiceRole } from "../lib/db/supabase-server";

async function setAdmin() {
  const userId = process.argv[2];
  
  if (!userId) {
    console.error("Usage: bun run scripts/set-admin.ts <clerk-user-id>");
    console.error("Example: bun run scripts/set-admin.ts user_2abc123...");
    process.exit(1);
  }
  
  console.log(`Setting user ${userId} as admin...`);
  
  const { data, error } = await supabaseServiceRole
    .from("user_settings")
    .update({ role: "admin" })
    .eq("user_id", userId)
    .select();
  
  if (error) {
    console.error("Error setting admin role:", error);
    process.exit(1);
  }
  
  if (!data || data.length === 0) {
    console.error("User not found. Make sure the user has logged in at least once.");
    process.exit(1);
  }
  
  console.log("✅ User successfully set as admin!");
  process.exit(0);
}

setAdmin();