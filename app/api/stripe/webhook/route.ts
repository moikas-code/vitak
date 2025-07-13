import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createServerSupabaseClient } from "@/lib/db/supabase-server";
import { checkRateLimit, RateLimitError } from "@/lib/security/rate-limit-redis";
import { API_RATE_LIMITS } from "@/lib/api/rate-limit";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting using service identifier
    try {
      await checkRateLimit('stripe_webhook_service', 'webhook', API_RATE_LIMITS.WEBHOOK);
    } catch (error) {
      if (error instanceof RateLimitError) {
        return NextResponse.json(
          { error: "Rate limit exceeded" },
          { status: 429 }
        );
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

    if (!webhookSecret) {
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
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

        // If we have a user ID, we could update their donation status
        if (session.metadata?.userId && session.metadata.userId !== "anonymous") {
          const supabase = await createServerSupabaseClient();
          
          // Log the donation in our audit_logs table
          await supabase.from("audit_logs").insert({
            user_id: session.metadata.userId,
            action: "donation_completed",
            details: {
              session_id: session.id,
              amount: session.amount_total,
              currency: session.currency,
              email: session.customer_details?.email,
            },
          });
        }

        break;
      }

      case "checkout.session.expired": {
        break;
      }

      case "payment_intent.succeeded": {
        break;
      }

      case "payment_intent.payment_failed": {
        break;
      }

      default:
        // Unhandled event type
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Stripe webhooks require the raw body
export const runtime = "nodejs";