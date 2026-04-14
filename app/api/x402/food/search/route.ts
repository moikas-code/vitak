import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { foods } from "@/lib/db/schema";
import { like, and, desc, sql, type SQL } from "drizzle-orm";
import type { FoodCategory } from "@/lib/types";

const X402_WALLET = "0xc406fFf2Ce8b5dce517d03cd3531960eb2F6110d";
const X402_NETWORK = "base";
const X402_VERSION = "1";
const PRICING = { food_search: 0.001 };

function formatUsdc(amount: number): string {
  return amount.toFixed(6);
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const x402Payment = request.headers.get("x-402-payment");
  const authorization = request.headers.get("authorization");

  if (!x402Payment && !authorization?.startsWith("Bearer ")) {
    return NextResponse.json(
      {
        error: "Payment required",
        x402_version: X402_VERSION,
        payment_required: {
          amount: formatUsdc(PRICING.food_search),
          currency: "USDC",
          network: X402_NETWORK,
          recipient: X402_WALLET,
          resource: "food/search",
          description: "Access to VitaK Tracker API: food search",
        },
      },
      { status: 402 }
    );
  }

  const query = url.searchParams.get("query") || "";
  const categoryParam = url.searchParams.get("category");
  const category = categoryParam as FoodCategory | undefined;
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50);

  if (!query || query.length < 2) {
    return NextResponse.json(
      { error: "Query parameter 'query' is required (minimum 2 characters)" },
      { status: 400 }
    );
  }

  const db = await getDb();

  const conditions: SQL<unknown>[] = [like(foods.name, `%${query}%`)];
  if (category) {
    conditions.push(sql`${foods.category} = ${category}`);
  }

  const results = await db
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
    .where(and(...conditions))
    .orderBy(desc(foods.vitaminKMcgPer100g))
    .limit(limit);

  const items = results.map((f) => ({
    ...f,
    portion_vitamin_k_mcg: Math.ceil(
      (f.common_portion_size_g / 100) * f.vitamin_k_mcg_per_100g
    ),
  }));

  return NextResponse.json(
    { items, total: items.length },
    {
      headers: {
        "X-402-Version": X402_VERSION,
        "X-402-Amount": formatUsdc(PRICING.food_search),
        "X-402-Recipient": X402_WALLET,
        "X-402-Network": X402_NETWORK,
        "Cache-Control": "public, max-age=300, s-maxage=600",
      },
    }
  );
}