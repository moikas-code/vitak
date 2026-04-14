import { NextRequest, NextResponse } from "next/server";

const X402_WALLET = "0xc406fFf2Ce8b5dce517d03cd3531960eb2F6110d";
const X402_NETWORK = "base";
const PRICING = { food_detail: 0.001 };

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const x402Payment = request.headers.get("x-402-payment");
  const authorization = request.headers.get("authorization");

  if (!x402Payment && !authorization?.startsWith("Bearer ")) {
    return NextResponse.json(
      {
        error: "Payment required",
        x402_version: "1",
        payment_required: {
          amount: PRICING.food_detail.toFixed(6),
          currency: "USDC",
          network: X402_NETWORK,
          recipient: X402_WALLET,
          resource: "food/detail",
          description: "Access to VitaK Tracker API: food detail",
        },
      },
      { status: 402 }
    );
  }

  const { id } = await params;

  const { getDb } = await import("@/lib/db");
  const { foods } = await import("@/lib/db/schema");
  const { eq } = await import("drizzle-orm");

  const db = await getDb();
  const food = await db
    .select()
    .from(foods)
    .where(eq(foods.id, id))
    .get();

  if (!food) {
    return NextResponse.json({ error: "Food not found" }, { status: 404 });
  }

  // Pre-calculate portions
  const portions = [
    { portion_name: food.commonPortionName, portion_size_g: food.commonPortionSizeG },
    { portion_name: "100g", portion_size_g: 100 },
    { portion_name: "1 oz (28.35g)", portion_size_g: 28.35 },
  ];

  const portion_calculations = portions.map((p) => ({
    portion_name: p.portion_name,
    portion_size_g: p.portion_size_g,
    vitamin_k_mcg: Math.ceil((p.portion_size_g / 100) * food.vitaminKMcgPer100g),
  }));

  return NextResponse.json(
    {
      id: food.id,
      name: food.name,
      vitamin_k_mcg_per_100g: food.vitaminKMcgPer100g,
      category: food.category,
      common_portion_size_g: food.commonPortionSizeG,
      common_portion_name: food.commonPortionName,
      data_source: food.dataSource,
      fdc_id: food.fdcId,
      verified_at: food.verifiedAt,
      portion_calculations,
    },
    {
      headers: {
        "X-402-Version": "1",
        "X-402-Amount": PRICING.food_detail.toFixed(6),
        "X-402-Recipient": X402_WALLET,
        "X-402-Network": X402_NETWORK,
        "Cache-Control": "public, max-age=300, s-maxage=600",
      },
    }
  );
}