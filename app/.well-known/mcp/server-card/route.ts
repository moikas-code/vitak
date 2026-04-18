import { NextResponse } from "next/server";

/**
 * MCP Server Card (SEP-1649 / modelcontextprotocol PR #2127)
 * Advertises the VitaK Tracker MCP server capabilities for agent discovery.
 * @see https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2127
 */
export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://vitaktracker.com";

  const card = {
    $schema: "https://modelcontextprotocol.io/schema/server-card",
    serverInfo: {
      name: "VitaK Tracker",
      version: "1.0.0",
      description: "Vitamin K food database and tracking API for warfarin patients. 7,793+ USDA-verified vitamin K values per 100g, credit-based tracking, and meal logging.",
    },
    transport: {
      type: "http",
      url: `${baseUrl}/.well-known/openapi.json`,
    },
    capabilities: {
      tools: true,
      resources: false,
      prompts: false,
      logging: false,
    },
    tools: [
      {
        name: "search_foods",
        description: "Search the vitamin K food database by name or category",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Food name search term" },
            category: { type: "string", description: "Optional category filter" },
            limit: { type: "integer", description: "Max results (1-50)" },
          },
          required: ["query"],
        },
      },
      {
        name: "get_food",
        description: "Get detailed food information by ID",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string", description: "Food ID" },
          },
          required: ["id"],
        },
      },
      {
        name: "calculate_vitamin_k",
        description: "Calculate vitamin K content for a specific food portion",
        inputSchema: {
          type: "object",
          properties: {
            food_id: { type: "string", description: "Food ID" },
            portion_size_g: { type: "number", description: "Portion size in grams" },
          },
          required: ["food_id", "portion_size_g"],
        },
      },
      {
        name: "export_food_data",
        description: "Export the complete vitamin K food database as JSON",
        inputSchema: {
          type: "object",
          properties: {
            category: { type: "string", description: "Filter by category" },
            source: { type: "string", description: "Filter: usda_fdc_sr_legacy, estimate, or all" },
          },
        },
      },
    ],
    authentication: {
      type: "x402",
      description: "API access via x402 payment protocol (USDC on Base)",
      url: `${baseUrl}/.well-known/x402`,
    },
    contact: {
      email: "support@vitaktracker.com",
      url: baseUrl,
    },
  };

  return NextResponse.json(card, {
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