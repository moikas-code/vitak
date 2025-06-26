import { headers } from "next/headers";
import { Webhook } from "svix";
import { WebhookEvent } from "@clerk/nextjs/server";
import { supabaseServiceRole } from "@/lib/db/supabase-server";

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occured -- no svix headers", {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || "");

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occured", {
      status: 400,
    });
  }

  // Handle the webhook
  const eventType = evt.type;

  if (eventType === "user.created" || eventType === "user.updated") {
    const { id, email_addresses, username, first_name, last_name, image_url } = evt.data;
    
    // Get primary email
    const primaryEmail = email_addresses?.find(email => email.id === evt.data.primary_email_address_id);
    
    try {
      // Upsert user in database
      const { error } = await supabaseServiceRole
        .from("users")
        .upsert({
          clerk_user_id: id,
          email: primaryEmail?.email_address || null,
          username: username || null,
          first_name: first_name || null,
          last_name: last_name || null,
          image_url: image_url || null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "clerk_user_id",
        });

      if (error) {
        console.error("Error upserting user:", error);
        return new Response("Error updating user", { status: 500 });
      }

      // Also ensure user_settings exist
      const { error: settingsError } = await supabaseServiceRole
        .from("user_settings")
        .upsert({
          user_id: id,
          daily_limit: 100,
          weekly_limit: 700,
          monthly_limit: 3000,
          tracking_period: "daily",
        }, {
          onConflict: "user_id",
          ignoreDuplicates: true,
        });

      if (settingsError && settingsError.code !== "23505") { // Ignore duplicate key errors
        console.error("Error creating user settings:", settingsError);
      }

      console.log(`User ${eventType === "user.created" ? "created" : "updated"}: ${id}`);
    } catch (error) {
      console.error("Database error:", error);
      return new Response("Database error", { status: 500 });
    }
  }

  if (eventType === "user.deleted") {
    const { id } = evt.data;
    
    try {
      // Soft delete or handle user deletion as needed
      // For now, we'll keep the data but you might want to implement a soft delete
      console.log(`User deleted event received for: ${id}`);
      
      // Optional: Mark user as deleted instead of hard delete
      // const { error } = await supabaseAdmin
      //   .from("users")
      //   .update({ deleted_at: new Date().toISOString() })
      //   .eq("clerk_user_id", id);
      
    } catch (error) {
      console.error("Error handling user deletion:", error);
      return new Response("Error handling deletion", { status: 500 });
    }
  }

  return new Response("", { status: 200 });
}