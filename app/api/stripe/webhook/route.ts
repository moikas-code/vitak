import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getDb } from "@/lib/db";
import { foodAuditLog } from "@/lib/db/schema";
import { checkRateLimit, RateLimitError } from "@/lib/security/rate-limit";
import { API_RATE_LIMITS } from "@/lib/api/rate-limit";

export async function POST(request: NextRequest) {
  // Check for Stripe configuration
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("Stripe webhook is not configured - missing credentials");
    return NextResponse.json(
      { error: "Webhook processing is not available" },
      { status: 503 }
    );
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  try {
    // Apply rate limiting
    try {
      await checkRateLimit("stripe_webhook_service", "webhook", API_RATE_LIMITS.WEBHOOK);
    } catch (error) {
      if (error instanceof RateLimitError) {
        return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
      }
      throw error;
    }

    const body = await request.text();
    const headersList = await headers();
    const sig = headersList.get("stripe-signature");

    if (!sig) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret!);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      return NextResponse.json(
        { error: `Webhook Error: ${errorMessage}` },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.metadata?.userId && session.metadata.userId !== "anonymous") {
          try {
            const db = await getDb();
            // Log the donation
            await db.insert(foodAuditLog).values({
              foodId: "donation",
              action: "create",
              changedBy: session.metadata.userId,
              newValues: JSON.stringify({
                type: "donation_completed",
                session_id: session.id,
                amount: session.amount_total,
                currency: session.currency,
                email: session.customer_details?.email,
              }),
            });
          } catch (error) {
            console.error("[Stripe Webhook] Error logging donation:", error);
          }
        }

        break;
      }

      case "checkout.session.expired":
      case "payment_intent.succeeded":
      case "payment_intent.payment_failed":
        break;

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}