import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { checkRateLimit, RateLimitError, RATE_LIMITS } from "@/lib/security/rate-limit-redis";


export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth();
    
    // Apply rate limiting
    const identifier = userId || `ip_${req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "unknown"}`;
    
    try {
      await checkRateLimit(identifier, 'feedback', RATE_LIMITS.FEEDBACK);
    } catch (error) {
      if (error instanceof RateLimitError) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Try again soon." },
          {
            status: 429,
            headers: {
              'Retry-After': String(Math.ceil((error.resetTime - Date.now()) / 1000)),
            }
          }
        );
      }
      throw error;
    }
    
    if (!userId) {
      return NextResponse.json({ error: "Please sign in to submit feedback" }, { status: 401 });
    }

    // Get user info
    const user = await currentUser();
    const username = user?.username || user?.firstName || "Anonymous";
    
    const { rating, feedback } = await req.json();
    
    // Validate input
    if (
      !rating ||
      typeof rating !== "number" ||
      rating < 1 ||
      rating > 5 ||
      !feedback ||
      typeof feedback !== "string" ||
      feedback.length === 0 ||
      feedback.length > 500
    ) {
      return NextResponse.json(
        { error: "Invalid input. Rating must be 1-5 and feedback must be 1-500 characters." }, 
        { status: 400 }
      );
    }
    
    const webhook_url = process.env.DISCORD_FEEDBACK_WEBHOOK_URL;
    if (!webhook_url) {
      console.error("Discord webhook URL not configured");
      // Still save feedback even if Discord webhook fails
      return NextResponse.json(
        { ok: true, message: "Feedback received. Thank you!" },
        { status: 200 }
      );
    }
    
    // Create star emoji string
    const stars = "⭐".repeat(rating) + "☆".repeat(5 - rating);
    
    const discord_payload = {
      embeds: [
        {
          title: `VitaK Tracker Feedback`,
          description: feedback,
          color: rating >= 4 ? 0x10b981 : rating >= 3 ? 0xfbbf24 : 0xef4444, // green/yellow/red
          fields: [
            { name: "User", value: username, inline: true },
            { name: "Rating", value: stars, inline: true },
            { name: "User ID", value: userId, inline: false },
          ],
          footer: {
            text: "VitaK Tracker Feedback System",
          },
          timestamp: new Date().toISOString(),
        },
      ],
    };
    
    const discord_res = await fetch(webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(discord_payload),
    });
    
    if (!discord_res.ok) {
      console.error("Failed to send to Discord:", discord_res.status);
      // Still return success to user
    }
    
    return NextResponse.json({ 
      ok: true,
      message: "Thank you for your feedback! We appreciate your input."
    });
  } catch (error) {
    console.error("Feedback API error:", error);
    return NextResponse.json(
      { error: "Failed to submit feedback. Please try again." }, 
      { status: 500 }
    );
  }
}