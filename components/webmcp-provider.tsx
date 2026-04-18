"use client";

import { useEffect } from "react";

/**
 * WebMCP Provider (SEP-1649 / Web Machine Learning Working Group)
 *
 * Registers VitaK Tracker tools with the browser's modelContext API
 * so AI agents browsing the site can discover and invoke them.
 *
 * Gracefully degrades if navigator.modelContext is unavailable
 * (currently a Chrome origin trial).
 *
 * @see https://webmachinelearning.github.io/webmcp/
 * @see https://developer.chrome.com/blog/webmcp-epp
 */

// Type the experimental API
interface ModelContextApi {
  provideContext: (context: {
    tools: Array<{
      name: string;
      description: string;
      inputSchema: Record<string, unknown>;
      execute: (args: Record<string, unknown>) => Promise<unknown>;
    }>;
  }) => Promise<void>;
}

declare global {
  interface Navigator {
    modelContext?: ModelContextApi;
  }
}

export function WebMcpProvider() {
  useEffect(() => {
    if (!("modelContext" in navigator) || !navigator.modelContext) {
      return;
    }

    const baseUrl = window.location.origin;

    navigator.modelContext
      .provideContext({
        tools: [
          {
            name: "search_vitamin_k_foods",
            description:
              "Search the vitamin K food database by name or category. Returns foods with vitamin K values per 100g, portion sizes, and USDA data source verification.",
            inputSchema: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "Food name to search for (e.g., 'spinach', 'broccoli')",
                },
                category: {
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
                  description: "Optional: filter by food category",
                },
                limit: {
                  type: "integer",
                  description: "Maximum results to return (1-50, default 20)",
                },
              },
              required: ["query"],
            },
            execute: async (args: Record<string, unknown>) => {
              const params = new URLSearchParams();
              params.set("query", String(args.query || ""));
              if (args.category) params.set("category", String(args.category));
              if (args.limit) params.set("limit", String(args.limit));
              const res = await fetch(`${baseUrl}/api/x402/food/search?${params}`);
              return res.json();
            },
          },
          {
            name: "get_food_details",
            description:
              "Get detailed information about a specific food, including portion calculations and vitamin K values.",
            inputSchema: {
              type: "object",
              properties: {
                id: { type: "string", description: "Food ID from search results" },
              },
              required: ["id"],
            },
            execute: async (args: Record<string, unknown>) => {
              const res = await fetch(`${baseUrl}/api/x402/food/${args.id}`);
              return res.json();
            },
          },
          {
            name: "calculate_vitamin_k",
            description:
              "Calculate the vitamin K content for a specific portion of food. Returns ceiling-rounded values (conservative for warfarin patients).",
            inputSchema: {
              type: "object",
              properties: {
                food_id: { type: "string", description: "Food ID from search results" },
                portion_size_g: {
                  type: "number",
                  description: "Portion size in grams",
                },
              },
              required: ["food_id", "portion_size_g"],
            },
            execute: async (args: Record<string, unknown>) => {
              const res = await fetch(`${baseUrl}/api/x402/calculate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  food_id: args.food_id,
                  portion_size_g: args.portion_size_g,
                }),
              });
              return res.json();
            },
          },
        ],
      })
      .then(() => {
        console.info("[WebMCP] Tools registered successfully");
      })
      .catch((err: unknown) => {
        console.warn("[WebMCP] Failed to register tools:", err);
      });
  }, []);

  return null;
}