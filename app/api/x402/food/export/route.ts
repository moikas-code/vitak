import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { foods } from "@/lib/db/schema";
import { eq, and, sql, type SQL } from "drizzle-orm";
import type { FoodCategory } from "@/lib/types";

const X402_WALLET = "0xc406fFf2Ce8b5dce517d03cd3531960eb2F6110d";
const X402_NETWORK = "base";
const PRICING = { export: 0.05 };

export async function GET(request: NextRequest) {
  const x402Payment = request.headers.get("x-402-payment");
  const authorization = request.headers.get("authorization");

  if (!x402Payment && !authorization?.startsWith("Bearer ")) {
    return NextResponse.json(
      {
        error: "Payment required",
        x402_version: "1",
        payment_required: {
          amount: PRICING.export.toFixed(6),
          currency: "USDC",
          network: X402_NETWORK,
          recipient: X402_WALLET,
          resource: "food/export",
          description: "Access to VitaK Tracker API: full food data export",
        },
      },
      { status: 402 }
    );
  }

  const url = new URL(request.url);
  const categoryParam = url.searchParams.get("category");
  const category = categoryParam as FoodCategory | undefined;
  const source = url.searchParams.get("source") || "all";

  const db = await getDb();

  const conditions: SQL<unknown>[] = [];
  if (category) {
    conditions.push(sql`${foods.category} = ${category}`);
  }
  if (source === "usda_fdc_sr_legacy") {
    conditions.push(eq(foods.dataSource, "usda_fdc_sr_legacy"));
  } else if (source === "estimate") {
    conditions.push(eq(foods.dataSource, "estimate"));
  }

  const allFoods = await db
    .select({
      id: foods.id,
      name: foods.name,
      vitamin_k_mcg_per_100g: foods.vitaminKMcgPer100g,
      category: foods.category,
      common_portion_size_g: foods.commonPortionSizeG,
      common_portion_name: foods.commonPortionName,
      data_source: foods.dataSource,
      fdc_id: foods.fdcId,
    })
    .from(foods)
    .where(conditions.length > 0 ? and(...conditions) : sql`1=1`)
    .orderBy(foods.category, foods.name);

  const usdaCount = allFoods.filter((f) => f.data_source === "usda_fdc_sr_legacy").length;
  const estimateCount = allFoods.filter((f) => f.data_source === "estimate").length;

  return NextResponse.json(
    {
      export_date: new Date().toISOString(),
      total_foods: allFoods.length,
      usda_verified_count: usdaCount,
      estimate_count: estimateCount,
      data_source_reference:
        "USDA FoodData Central SR Legacy (nutrient ID 1185, phylloquinone)",
      safety_note:
        "Values are per 100g. Vitamin K content varies by cooking method and variety. Prepared food values are estimates.",
      foods: allFoods,
    },
    {
      headers: {
        "X-402-Version": "1",
        "X-402-Amount": PRICING.export.toFixed(6),
        "X-402-Recipient": X402_WALLET,
        "X-402-Network": X402_NETWORK,
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    }
  );
}