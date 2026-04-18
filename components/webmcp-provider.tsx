"use client";

import { useEffect } from "react";

/**
 * WebMCP Provider — registers VitaK Tracker tools via navigator.modelContext
 *
 * Uses two strategies:
 * 1. Inline <script> in <head> fires immediately on page load (for scanners)
 * 2. useEffect re-registration after hydration (for browsers supporting the API)
 *
 * @see https://webmachinelearning.github.io/webmcp/
 * @see https://developer.chrome.com/blog/webmcp-epp
 */

const WEBMCP_SCRIPT = `
(function() {
  var TOOLS = [
    {
      name: "search_vitamin_k_foods",
      description: "Search the vitamin K food database by name or category. Returns foods with vitamin K values per 100g, portion sizes, and USDA data source verification.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Food name to search for (e.g., 'spinach', 'broccoli')" },
          category: { type: "string", enum: ["vegetables","fruits","proteins","grains","dairy","fats_oils","beverages","nuts_seeds","herbs_spices","prepared_foods","other"], description: "Optional: filter by food category" },
          limit: { type: "integer", description: "Maximum results to return (1-50, default 20)" }
        },
        required: ["query"]
      },
      execute: function(args) {
        var p = new URLSearchParams();
        p.set("query", args.query || "");
        if (args.category) p.set("category", args.category);
        if (args.limit) p.set("limit", args.limit);
        return fetch(location.origin + "/api/x402/food/search?" + p.toString()).then(function(r) { return r.json(); });
      }
    },
    {
      name: "get_food_details",
      description: "Get detailed information about a specific food, including portion calculations and vitamin K values.",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Food ID from search results" }
        },
        required: ["id"]
      },
      execute: function(args) {
        return fetch(location.origin + "/api/x402/food/" + encodeURIComponent(args.id)).then(function(r) { return r.json(); });
      }
    },
    {
      name: "calculate_vitamin_k",
      description: "Calculate the vitamin K content for a specific portion of food. Returns ceiling-rounded values (conservative for warfarin patients).",
      inputSchema: {
        type: "object",
        properties: {
          food_id: { type: "string", description: "Food ID from search results" },
          portion_size_g: { type: "number", description: "Portion size in grams" }
        },
        required: ["food_id", "portion_size_g"]
      },
      execute: function(args) {
        return fetch(location.origin + "/api/x402/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ food_id: args.food_id, portion_size_g: args.portion_size_g })
        }).then(function(r) { return r.json(); });
      }
    },
    {
      name: "export_food_data",
      description: "Export the complete vitamin K food database as JSON, optionally filtered by category or data source.",
      inputSchema: {
        type: "object",
        properties: {
          category: { type: "string", description: "Filter by food category" },
          source: { type: "string", enum: ["usda_fdc_sr_legacy", "estimate", "all"], description: "Filter by data source" }
        }
      },
      execute: function(args) {
        var p = new URLSearchParams();
        if (args.category) p.set("category", args.category);
        if (args.source) p.set("source", args.source);
        return fetch(location.origin + "/api/x402/food/export?" + p.toString()).then(function(r) { return r.json(); });
      }
    }
  ];

  function registerWebMCP() {
    if (navigator.modelContext && navigator.modelContext.provideContext) {
      navigator.modelContext.provideContext({ tools: TOOLS }).then(function() {
        console.info("[WebMCP] Tools registered successfully");
      }).catch(function(err) {
        console.warn("[WebMCP] Failed to register tools:", err);
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", registerWebMCP);
  } else {
    registerWebMCP();
  }
})();
`;

export function WebMcpProvider() {
  // Re-register after hydration for browsers that have the API
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.modelContext?.provideContext) {
      const tools = [
        {
          name: "search_vitamin_k_foods",
          description: "Search the vitamin K food database by name or category.",
          inputSchema: {
            type: "object",
            properties: {
              query: { type: "string", description: "Food name to search for" },
              category: { type: "string", description: "Filter by category" },
              limit: { type: "integer", description: "Max results (1-50)" },
            },
            required: ["query"],
          },
          execute: async (args: Record<string, unknown>) => {
            const params = new URLSearchParams();
            params.set("query", String(args.query || ""));
            if (args.category) params.set("category", String(args.category));
            if (args.limit) params.set("limit", String(args.limit));
            const res = await fetch(`${window.location.origin}/api/x402/food/search?${params}`);
            return res.json();
          },
        },
        {
          name: "get_food_details",
          description: "Get detailed food information by ID.",
          inputSchema: {
            type: "object",
            properties: { id: { type: "string", description: "Food ID" } },
            required: ["id"],
          },
          execute: async (args: Record<string, unknown>) => {
            const res = await fetch(`${window.location.origin}/api/x402/food/${args.id}`);
            return res.json();
          },
        },
        {
          name: "calculate_vitamin_k",
          description: "Calculate vitamin K for a food portion.",
          inputSchema: {
            type: "object",
            properties: {
              food_id: { type: "string", description: "Food ID" },
              portion_size_g: { type: "number", description: "Portion in grams" },
            },
            required: ["food_id", "portion_size_g"],
          },
          execute: async (args: Record<string, unknown>) => {
            const res = await fetch(`${window.location.origin}/api/x402/calculate`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ food_id: args.food_id, portion_size_g: args.portion_size_g }),
            });
            return res.json();
          },
        },
        {
          name: "export_food_data",
          description: "Export the food database as JSON.",
          inputSchema: {
            type: "object",
            properties: {
              category: { type: "string", description: "Filter by category" },
              source: { type: "string", description: "Filter by data source" },
            },
          },
          execute: async (args: Record<string, unknown>) => {
            const params = new URLSearchParams();
            if (args.category) params.set("category", String(args.category));
            if (args.source) params.set("source", String(args.source));
            const res = await fetch(`${window.location.origin}/api/x402/food/export?${params}`);
            return res.json();
          },
        },
      ];

      navigator.modelContext
        .provideContext({ tools })
        .then(() => console.info("[WebMCP] Re-registered after hydration"))
        .catch((err: unknown) => console.warn("[WebMCP] Re-registration failed:", err));
    }
  }, []);

  return (
    <script
      dangerouslySetInnerHTML={{ __html: WEBMCP_SCRIPT }}
      id="webmcp-tools"
    />
  );
}