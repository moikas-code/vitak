import { NextResponse } from "next/server";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://vitaktracker.com";

  const openapi = {
    openapi: "3.1.0",
    info: {
      title: "VitaK Tracker API",
      description:
        "Vitamin K food data API for warfarin patients. Provides USDA-sourced vitamin K (phylloquinone) values per 100g for 89 foods, credit-based tracking, and meal logging. Data sourced from USDA FoodData Central SR Legacy data.",
      version: "1.0.0",
      contact: {
        name: "VitaK Tracker",
        url: baseUrl,
      },
    },
    servers: [{ url: baseUrl }],
    paths: {
      "/api/x402/food/search": {
        get: {
          operationId: "searchFoods",
          summary: "Search vitamin K food database",
          description:
            "Search the food database by name or category. Returns foods with vitamin K values per 100g, portion sizes, and data source verification.",
          tags: ["Food Database"],
          parameters: [
            {
              name: "query",
              in: "query",
              required: true,
              description: "Search term (food name, e.g., 'spinach', 'broccoli')",
              schema: { type: "string", minLength: 2 },
            },
            {
              name: "category",
              in: "query",
              required: false,
              description: "Filter by food category",
              schema: {
                type: "string",
                enum: [
                  "vegetables",
                  "fruits",
                  "proteins",
                  "grains",
                  "dairy",
                  "fats_oils",
                  "beverages",
                  "nuts_seeds",
                  "herbs_spices",
                  "prepared_foods",
                  "other",
                ],
              },
            },
            {
              name: "limit",
              in: "query",
              required: false,
              description: "Maximum results to return (1-50)",
              schema: { type: "integer", minimum: 1, maximum: 50, default: 20 },
            },
          ],
          responses: {
            "200": {
              description: "List of matching foods",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/FoodSearchResponse" },
                },
              },
            },
            "402": {
              description: "Payment required (x402 protocol)",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/PaymentRequiredResponse" },
                },
              },
            },
          },
        },
      },
      "/api/x402/food/{id}": {
        get: {
          operationId: "getFoodById",
          summary: "Get food details by ID",
          description:
            "Retrieve detailed information about a specific food, including portion calculations.",
          tags: ["Food Database"],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              description: "Food ID",
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "Food details",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/FoodDetailResponse" },
                },
              },
            },
            "404": { description: "Food not found" },
            "402": { description: "Payment required (x402)" },
          },
        },
      },
      "/api/x402/calculate": {
        post: {
          operationId: "calculateVitaminK",
          summary: "Calculate vitamin K for a food portion",
          description:
            "Calculate the vitamin K content for a specific portion of food. Returns ceiling-rounded values (conservative for warfarin patients).",
          tags: ["Calculator"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CalculateRequest" },
              },
            },
          },
          responses: {
            "200": {
              description: "Calculation result",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/CalculateResponse" },
                },
              },
            },
            "402": { description: "Payment required (x402)" },
            "404": { description: "Food not found" },
          },
        },
      },
      "/api/x402/food/export": {
        get: {
          operationId: "exportFoodData",
          summary: "Export vitamin K food data",
          description:
            "Export the complete food database as JSON, optionally filtered by category or data source.",
          tags: ["Data Export"],
          parameters: [
            {
              name: "category",
              in: "query",
              required: false,
              schema: { type: "string" },
              description: "Filter by category",
            },
            {
              name: "source",
              in: "query",
              required: false,
              schema: {
                type: "string",
                enum: ["usda_fdc_sr_legacy", "estimate", "all"],
              },
              description: "Filter by data source",
            },
          ],
          responses: {
            "200": {
              description: "Food data export",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ExportResponse" },
                },
              },
            },
            "402": { description: "Payment required (x402)" },
          },
        },
      },
    },
    components: {
      schemas: {
        FoodSearchResponse: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: { $ref: "#/components/schemas/FoodItem" },
            },
            total: { type: "integer" },
          },
        },
        FoodDetailResponse: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            vitamin_k_mcg_per_100g: { type: "number" },
            category: { type: "string" },
            common_portion_size_g: { type: "number" },
            common_portion_name: { type: "string" },
            data_source: { type: "string" },
            fdc_id: { type: "integer", nullable: true },
            verified_at: { type: "string", nullable: true },
            portion_calculations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  portion_name: { type: "string" },
                  portion_size_g: { type: "number" },
                  vitamin_k_mcg: { type: "number" },
                },
              },
            },
          },
        },
        CalculateRequest: {
          type: "object",
          required: ["food_id", "portion_size_g"],
          properties: {
            food_id: { type: "string", description: "Food ID from search results" },
            portion_size_g: { type: "number", description: "Portion size in grams", minimum: 1 },
          },
        },
        CalculateResponse: {
          type: "object",
          properties: {
            food: { $ref: "#/components/schemas/FoodItem" },
            portion_size_g: { type: "number" },
            vitamin_k_mcg: {
              type: "number",
              description: "Calculated vitamin K (ceil rounded for warfarin safety)",
            },
            percentage_of_daily_limit: { type: "number" },
            daily_limit_reference: { type: "string" },
          },
        },
        ExportResponse: {
          type: "object",
          properties: {
            export_date: { type: "string", format: "date-time" },
            total_foods: { type: "integer" },
            usda_verified_count: { type: "integer" },
            estimate_count: { type: "integer" },
            foods: {
              type: "array",
              items: { $ref: "#/components/schemas/FoodItem" },
            },
          },
        },
        FoodItem: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            vitamin_k_mcg_per_100g: { type: "number" },
            category: { type: "string" },
            common_portion_size_g: { type: "number" },
            common_portion_name: { type: "string" },
            data_source: { type: "string", enum: ["usda_fdc_sr_legacy", "estimate"] },
            fdc_id: { type: "integer", nullable: true },
          },
        },
        PaymentRequiredResponse: {
          type: "object",
          properties: {
            error: { type: "string" },
            x402_version: { type: "string" },
            payment_required: {
              type: "object",
              properties: {
                amount: { type: "string", description: "Amount in USDC" },
                currency: { type: "string" },
                network: { type: "string" },
                recipient: { type: "string" },
                resource: { type: "string" },
                description: { type: "string" },
              },
            },
          },
        },
      },
    },
  };

  return NextResponse.json(openapi, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-402-Version, X-402-Recipient",
      "Cache-Control": "public, max-age=3600",
    },
  });
}