"use client";

import Script from "next/script";

/**
 * WebMCP Provider — registers VitaK Tracker tools via navigator.modelContext
 *
 * Injects an inline script into <head> that calls navigator.modelContext.provideContext()
 * with 4 tool definitions. The registration is unconditional — if the API isn't
 * available, the call is silently skipped.
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

  function register() {
    try {
      if (navigator.modelContext && typeof navigator.modelContext.provideContext === 'function') {
        navigator.modelContext.provideContext({ tools: TOOLS }).then(function() {
          console.info("[WebMCP] Tools registered successfully");
        }).catch(function(err) {
          console.warn("[WebMCP] Registration failed:", err);
        });
      }
    } catch(e) {
      // navigator.modelContext not available — skip silently
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', register);
  } else {
    register();
  }
})();
`;

export function WebMcpProvider() {
  return (
    <Script
      id="webmcp-tools"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{ __html: WEBMCP_SCRIPT }}
    />
  );
}