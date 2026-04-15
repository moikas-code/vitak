import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { foods, nutrients } from "@/lib/db/schema";
import { eq, sql, count } from "drizzle-orm";

/**
 * Admin endpoint to check USDA FDC food sync status.
 * GET /api/admin/sync-usda?stats=true  — Get sync stats
 */
export async function GET(request: NextRequest) {
  const db = await getDb();
  const url = new URL(request.url);
  const statsOnly = url.searchParams.get("stats") === "true";

  if (statsOnly) {
    const totalResult = await db
      .select({ cnt: count() })
      .from(foods)
      .where(eq(foods.dataSource, "usda_fdc_sr_legacy"));
    const withVkResult = await db
      .select({ cnt: count() })
      .from(foods)
      .where(sql`vitamin_k_mcg_per_100g > 0`);
    const nutrientCount = await db
      .select({ cnt: count() })
      .from(nutrients);

    return NextResponse.json({
      totalUsda: totalResult[0]?.cnt ?? 0,
      withVitaminK: withVkResult[0]?.cnt ?? 0,
      nutrientReferences: nutrientCount[0]?.cnt ?? 0,
      message: "Use the local sync script to populate the database, then batch upload to remote D1 via seed-remote-d1.ts",
    });
  }

  return NextResponse.json({
    message: "USDA FDC sync is managed via scripts. Use: bun run sync:usda (local) or bun run seed:remote (remote D1)",
  });
}