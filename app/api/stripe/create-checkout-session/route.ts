import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@clerk/nextjs/server";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-05-28.basil",
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    // Require authentication for donations
    if (!session?.userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { amount } = await req.json();

    // Validate amount (in cents)
    if (!amount || typeof amount !== "number" || amount < 100) {
      return NextResponse.json(
        { error: "Invalid amount. Minimum is $1.00" },
        { status: 400 }
      );
    }

    // Maximum amount validation (e.g., $10,000)
    if (amount > 1000000) {
      return NextResponse.json(
        { error: "Amount exceeds maximum allowed" },
        { status: 400 }
      );
    }

    // Ensure amount is an integer (no fractional cents)
    if (!Number.isInteger(amount)) {
      return NextResponse.json(
        { error: "Amount must be a whole number of cents" },
        { status: 400 }
      );
    }

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Support VitaK Tracker",
              description: "One-time donation to support VitaK Tracker development",
              images: [`${process.env.NEXT_PUBLIC_APP_URL}/icon-512x512.svg`],
            },
            unit_amount: amount, // Amount in cents
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/donate/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      metadata: {
        userId: session.userId,
        donation_type: "one-time",
      },
    });

    return NextResponse.json({ sessionId: checkoutSession.id });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}