import { headers } from "next/headers";
import { Webhook } from "svix";
import { WebhookEvent } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { userSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { checkRateLimit, RateLimitError, RATE_LIMITS } from "@/lib/security/rate-limit";

export async function POST(req: Request) {
  // Apply rate limiting
  try {
    await checkRateLimit("clerk_webhook_service", "webhook", RATE_LIMITS.ADMIN_READ);
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

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occurred -- no svix headers", { status: 400 });
  }

  if (!process.env.CLERK_WEBHOOK_SECRET) {
    return new Response("Webhook secret not configured", { status: 500 });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Verify the webhook
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch {
    return new Response("Error verifying webhook", { status: 400 });
  }

  const eventType = evt.type;

  // Handle user creation/updates
  if (eventType === "user.created" || eventType === "user.updated") {
    const { id: userId } = evt.data;
    // Other fields available: email_addresses, username, first_name, last_name, image_url
    if (!userId) return new Response("Missing user ID", { status: 400 });


    try {
      const db = await getDb();

      // Ensure user settings exist
      const existing = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, userId))
        .get();

      if (!existing && eventType === "user.created") {
        await db.insert(userSettings).values({
          userId: userId,
          dailyLimit: 100,
          weeklyLimit: 700,
          monthlyLimit: 3000,
          trackingPeriod: "daily",
          role: "user",
        });
      }
    } catch (error) {
      console.error("[Clerk Webhook] Error processing user event:", error);
      return new Response("Error processing webhook", { status: 500 });
    }
  }

  if (eventType === "user.deleted") {
    const { id: userId } = evt.data;
    if (!userId) return new Response("Missing user ID", { status: 400 });

    try {
      const db = await getDb();
      // Clean up user data — D1 doesn't cascade delete like PG,
      // so we handle it explicitly
      await db.delete(userSettings).where(eq(userSettings.userId, userId));
    } catch (error) {
      console.error("[Clerk Webhook] Error deleting user:", error);
      return new Response("Error processing webhook", { status: 500 });
    }
  }

  return new Response("OK", { status: 200 });
}