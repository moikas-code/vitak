import { NextResponse } from "next/server";

/**
 * Agent Skills Discovery Index (agent-skills-discovery-rfc v0.2.0)
 * Lists available skills/capabilities that AI agents can invoke on this site.
 * @see https://github.com/cloudflare/agent-skills-discovery-rfc
 */
export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://vitaktracker.com";

  const index = {
    $schema: "https://agentskills.io/schema/index.json",
    skills: [
      {
        name: "food-search",
        type: "api",
        description: "Search the vitamin K food database by name or category. Returns foods with vitamin K values per 100g, portion sizes, and USDA data source verification.",
        url: `${baseUrl}/.well-known/openapi.json`,
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Food name search term (e.g., 'spinach', 'broccoli')" },
            category: { type: "string", enum: ["vegetables", "fruits", "proteins", "grains", "dairy", "fats_oils", "beverages", "nuts_seeds", "herbs_spices", "prepared_foods", "other"] },
            limit: { type: "integer", minimum: 1, maximum: 50, default: 20 },
          },
          required: ["query"],
        },
      },
      {
        name: "food-detail",
        type: "api",
        description: "Get detailed information about a specific food, including portion calculations and vitamin K values.",
        url: `${baseUrl}/.well-known/openapi.json`,
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string", description: "Food ID from search results" },
          },
          required: ["id"],
        },
      },
      {
        name: "calculate-vitamin-k",
        type: "api",
        description: "Calculate the vitamin K content for a specific portion of food. Returns ceiling-rounded values (conservative for warfarin patients).",
        url: `${baseUrl}/.well-known/openapi.json`,
        inputSchema: {
          type: "object",
          properties: {
            food_id: { type: "string", description: "Food ID from search results" },
            portion_size_g: { type: "number", minimum: 1, description: "Portion size in grams" },
          },
          required: ["food_id", "portion_size_g"],
        },
      },
      {
        name: "food-export",
        type: "api",
        description: "Export the complete food database as JSON, optionally filtered by category or data source (USDA-verified vs estimate).",
        url: `${baseUrl}/.well-known/openapi.json`,
        inputSchema: {
          type: "object",
          properties: {
            category: { type: "string", description: "Filter by food category" },
            source: { type: "string", enum: ["usda_fdc_sr_legacy", "estimate", "all"], description: "Filter by data source" },
          },
        },
      },
    ],
  };

  return NextResponse.json(index, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}