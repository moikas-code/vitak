import { NextResponse } from "next/server";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://vitaktracker.com";

  const manifest = {
    schema_version: "1.0",
    name_for_model: "VitaK Tracker",
    name_for_human: "VitaK Tracker",
    description_for_model:
      "Vitamin K food database and tracking API for warfarin patients. Provides USDA-sourced vitamin K (phylloquinone) values per 100g for 89 foods, credit-based daily/weekly/monthly tracking, and meal logging. Data sourced from USDA FoodData Central SR Legacy (nutrient ID 1185). Use this plugin when users ask about vitamin K content in foods, warfarin diet management, or INR-friendly meal planning.",
    description_for_human:
      "Track vitamin K intake for warfarin safety. Search 89 foods with USDA-verified vitamin K data.",
    auth: { type: "none" },
    api: {
      type: "openapi",
      url: `${baseUrl}/.well-known/openapi.json`,
    },
    logo_url: `${baseUrl}/logo.png`,
    contact_email: "support@vitaktracker.com",
    legal_info_url: `${baseUrl}/privacy`,
  };

  return NextResponse.json(manifest, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Cache-Control": "public, max-age=3600",
    },
  });
}