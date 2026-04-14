import { NextRequest, NextResponse } from "next/server";

const X402_WALLET = "0xc406fFf2Ce8b5dce517d03cd3531960eb2F6110d";
const X402_NETWORK = "base";
const PRICING = { calculate: 0.002 };

export async function POST(request: NextRequest) {
  const x402Payment = request.headers.get("x-402-payment");
  const authorization = request.headers.get("authorization");

  if (!x402Payment && !authorization?.startsWith("Bearer ")) {
    return NextResponse.json(
      {
        error: "Payment required",
        x402_version: "1",
        payment_required: {
          amount: PRICING.calculate.toFixed(6),
          currency: "USDC",
          network: X402_NETWORK,
          recipient: X402_WALLET,
          resource: "calculate",
          description: "Access to VitaK Tracker API: vitamin K calculation",
        },
      },
      { status: 402 }
    );
  }

  let body: { food_id?: string; portion_size_g?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (!body.food_id || !body.portion_size_g || body.portion_size_g <= 0) {
    return NextResponse.json(
      {
        error: "Missing required fields: food_id and portion_size_g (positive number in grams)",
      },
      { status: 400 }
    );
  }

  const { getDb } = await import("@/lib/db");
  const { foods } = await import("@/lib/db/schema");
  const { eq } = await import("drizzle-orm");

  const db = await getDb();
  const food = await db
    .select()
    .from(foods)
    .where(eq(foods.id, body.food_id!))
    .get();

  if (!food) {
    return NextResponse.json({ error: "Food not found" }, { status: 404 });
  }

  // Calculate vitamin K (ceil for warfarin safety — never undercount)
  const vitamin_k_mcg = Math.ceil(
    (body.portion_size_g / 100) * food.vitaminKMcgPer100g
  );
  const daily_limit = 100; // Default 100mcg daily limit
  const percentage = Math.round((vitamin_k_mcg / daily_limit) * 100 * 10) / 10;

  return NextResponse.json(
    {
      food: {
        id: food.id,
        name: food.name,
        vitamin_k_mcg_per_100g: food.vitaminKMcgPer100g,
        category: food.category,
        data_source: food.dataSource,
      },
      portion_size_g: body.portion_size_g,
      vitamin_k_mcg: vitamin_k_mcg,
      calculation_note:
        "Value is ceiling-rounded for warfarin patient safety. Actual vitamin K may be slightly lower.",
      percentage_of_daily_limit: percentage,
      daily_limit_reference: "Standard 100mcg daily limit for warfarin patients. Individual limits may vary.",
    },
    {
      headers: {
        "X-402-Version": "1",
        "X-402-Amount": PRICING.calculate.toFixed(6),
        "X-402-Recipient": X402_WALLET,
        "X-402-Network": X402_NETWORK,
        "Cache-Control": "no-store",
      },
    }
  );
}