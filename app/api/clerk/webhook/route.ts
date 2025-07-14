import { headers } from "next/headers";
import { Webhook } from "svix";
import { WebhookEvent } from "@clerk/nextjs/server";
import { supabaseServiceRole } from "@/lib/db/supabase-server";
import { checkRateLimit, RateLimitError } from "@/lib/security/rate-limit-redis";
import { API_RATE_LIMITS } from "@/lib/api/rate-limit";

export async function POST(req: Request) {
  // Apply rate limiting using service identifier
  try {
    await checkRateLimit('clerk_webhook_service', 'webhook', API_RATE_LIMITS.WEBHOOK);
  } catch (error) {
    if (error instanceof RateLimitError) {
      return new Response("Rate limit exceeded", { status: 429 });
    }
    throw error;
  }
  
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

  // Check if webhook secret is configured
  if (!process.env.CLERK_WEBHOOK_SECRET) {
    return new Response("Webhook secret not configured", {
      status: 500,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch {
    return new Response("Error occured", {
      status: 400,
    });
  }

  // Handle the webhook
  const eventType = evt.type;

  if (eventType === "user.created" || eventType === "user.updated") {
    const { id, email_addresses, username, first_name, last_name, image_url, public_metadata } = evt.data;
    
    // Get primary email
    const primaryEmail = email_addresses?.find(email => email.id === evt.data.primary_email_address_id);
    
    // Get role from Clerk public metadata, default to 'user'
    const role = (public_metadata?.role as string) || 'user';
    
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
        return new Response("Error updating user", { status: 500 });
      }

      // Also ensure user_settings exist with role
      const { error: settingsError } = await supabaseServiceRole
        .from("user_settings")
        .upsert({
          user_id: id,
          daily_limit: 100,
          weekly_limit: 700,
          monthly_limit: 3000,
          tracking_period: "daily",
          role: role as "user" | "admin",
        }, {
          onConflict: "user_id",
          ignoreDuplicates: true,
        });

      if (settingsError && settingsError.code !== "23505") { // Ignore duplicate key errors
        return new Response("Error creating user settings", { status: 500 });
      }

    } catch {
      return new Response("Database error", { status: 500 });
    }
  }

  if (eventType === "user.deleted") {
    try {
      // Soft delete or handle user deletion as needed
      // For now, we'll keep the data but you might want to implement a soft delete
      
      // Optional: Mark user as deleted instead of hard delete
      // const { error } = await supabaseAdmin
      //   .from("users")
      //   .update({ deleted_at: new Date().toISOString() })
      //   .eq("clerk_user_id", id);
      
    } catch {
      return new Response("Error handling deletion", { status: 500 });
    }
  }

  return new Response("", { status: 200 });
}