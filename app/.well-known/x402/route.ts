import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    x402_version: "1",
    name: "VitaK Tracker API",
    description: "Vitamin K food data and calculation API for warfarin patients",
    homepage: "https://vitaktracker.com",
    documentation: "https://vitaktracker.com/.well-known/openapi.json",
    wallet: "0xc406fFf2Ce8b5dce517d03cd3531960eb2F6110d",
    network: "base",
    currency: "USDC",
    endpoints: [
      {
        path: "/api/x402/food/search",
        method: "GET",
        description: "Search vitamin K food database",
        price: "$0.001",
        price_usdc: "0.001000",
        params: [
          { name: "query", type: "string", required: true, description: "Food name search term" },
          { name: "category", type: "string", required: false, description: "Food category filter" },
          { name: "limit", type: "integer", required: false, description: "Max results (1-50)" },
        ],
      },
      {
        path: "/api/x402/food/{id}",
        method: "GET",
        description: "Get food details by ID with portion calculations",
        price: "$0.001",
        price_usdc: "0.001000",
        params: [
          { name: "id", type: "string", required: true, description: "Food ID" },
        ],
      },
      {
        path: "/api/x402/calculate",
        method: "POST",
        description: "Calculate vitamin K for a food portion",
        price: "$0.002",
        price_usdc: "0.002000",
        params: [
          { name: "food_id", type: "string", required: true, description: "Food ID" },
          { name: "portion_size_g", type: "number", required: true, description: "Portion size in grams" },
        ],
      },
      {
        path: "/api/x402/food/export",
        method: "GET",
        description: "Export complete food database as JSON",
        price: "$0.05",
        price_usdc: "0.050000",
        params: [
          { name: "category", type: "string", required: false, description: "Filter by category" },
          { name: "source", type: "string", required: false, description: "Filter: usda_fdc_sr_legacy, estimate, or all" },
        ],
      },
    ],
    data_sources: {
      usda_verified: {
        count: 38,
        description: "Verified against USDA FoodData Central SR Legacy data",
        nutrient: "Vitamin K (phylloquinone), nutrient ID 1185",
      },
      estimates: {
        count: 51,
        description: "Estimated values for prepared foods and products with natural variation",
      },
    },
    safety_note: "Vitamin K values are ceiling-rounded for warfarin patient safety. Individual needs may vary. Always consult your healthcare provider.",
  }, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600",
    },
  });
}