import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { userSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withRateLimit, API_RATE_LIMITS } from "@/lib/api/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    return await withRateLimit(req, session.userId, "auth_sync", API_RATE_LIMITS.AUTH_SYNC, async () => {
      const body: { clerk_user_id?: string } = await req.json();
      const { clerk_user_id } = body;

      if (clerk_user_id !== session.userId) {
        return NextResponse.json({ error: "User ID mismatch" }, { status: 403 });
      }

      const db = await getDb();

      // Ensure user settings exist
      const existing = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, clerk_user_id))
        .get();

      if (!existing) {
        await db.insert(userSettings).values({
          userId: clerk_user_id,
          dailyLimit: 100,
          weeklyLimit: 700,
          monthlyLimit: 3000,
          trackingPeriod: "daily",
          role: "user",
        });
      }

      return NextResponse.json({
        success: true,
        message: "User synced successfully",
      });
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unexpected error during sync",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}