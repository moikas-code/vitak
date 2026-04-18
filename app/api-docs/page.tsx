import { Metadata } from "next";
import { Footer } from "@/components/ui/footer";
import { PublicHeader } from "@/components/ui/public-header";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Vitamin K API — Developer Documentation",
  description:
    "Programmatic access to the VitaK Tracker vitamin K food database. USDA-verified nutritional data for warfarin patients via REST API with x402 payment protocol.",
  openGraph: {
    title: "VitaK Tracker API — Vitamin K Food Data",
    description: "Access vitamin K data for thousands of foods via REST API. 7,793+ USDA-verified values, portion calculations, and export capabilities.",
    type: "website",
  },
};

const endpoints = [
  {
    method: "GET",
    path: "/api/x402/food/search",
    description: "Search the vitamin K food database by name or category",
    price: "$0.001",
    params: [
      { name: "query", type: "string", required: true, example: "spinach" },
      { name: "category", type: "string", required: false, example: "vegetables" },
      { name: "limit", type: "integer", required: false, example: "20" },
    ],
    response: `{
  "items": [
    {
      "id": "abc123",
      "name": "Spinach (raw)",
      "vitamin_k_mcg_per_100g": 483,
      "category": "vegetables",
      "common_portion_size_g": 30,
      "common_portion_name": "1 cup",
      "data_source": "usda_fdc_sr_legacy",
      "fdc_id": 168462,
      "portion_vitamin_k_mcg": 145
    }
  ],
  "total": 1
}`,
  },
  {
    method: "GET",
    path: "/api/x402/food/{id}",
    description: "Get detailed food information with portion calculations",
    price: "$0.001",
    params: [
      { name: "id", type: "string", required: true, example: "abc123" },
    ],
    response: `{
  "id": "abc123",
  "name": "Spinach (raw)",
  "vitamin_k_mcg_per_100g": 483,
  "category": "vegetables",
  "data_source": "usda_fdc_sr_legacy",
  "fdc_id": 168462,
  "portion_calculations": [
    { "portion_name": "1 cup", "portion_size_g": 30, "vitamin_k_mcg": 145 },
    { "portion_name": "100g", "portion_size_g": 100, "vitamin_k_mcg": 483 },
    { "portion_name": "1 oz (28.35g)", "portion_size_g": 28.35, "vitamin_k_mcg": 137 }
  ]
}`,
  },
  {
    method: "POST",
    path: "/api/x402/calculate",
    description: "Calculate vitamin K for a specific food portion",
    price: "$0.002",
    params: [
      { name: "food_id", type: "string", required: true, example: "abc123" },
      { name: "portion_size_g", type: "number", required: true, example: "180" },
    ],
    response: `{
  "food": { "id": "abc123", "name": "Spinach (raw)", "vitamin_k_mcg_per_100g": 483 },
  "portion_size_g": 180,
  "vitamin_k_mcg": 870,
  "percentage_of_daily_limit": 870,
  "daily_limit_reference": "Standard 100mcg daily limit"
}`,
  },
  {
    method: "GET",
    path: "/api/x402/food/export",
    description: "Export the complete food database as JSON",
    price: "$0.05",
    params: [
      { name: "category", type: "string", required: false, example: "vegetables" },
      { name: "source", type: "string", required: false, example: "usda_fdc_sr_legacy" },
    ],
    response: `{
  "export_date": "2026-04-14T00:00:00Z",
  "total_foods": 7844,
  "usda_verified_count": 7793,
  "estimate_count": 51,
  "foods": [...]
}`,
  },
];

const categories = [
  { name: "vegetables", count: 1480, description: "Leafy greens, cruciferous vegetables, and other VK-rich vegetables" },
  { name: "herbs_spices", count: 63, description: "Fresh herbs with very high VK concentration per 100g" },
  { name: "fruits", count: 696, description: "Fruits with moderate to low VK content" },
  { name: "proteins", count: 2992, description: "Protein sources, most with near-zero VK" },
  { name: "fats_oils", count: 287, description: "Cooking oils with varying VK content" },
  { name: "grains", count: 480, description: "Grains and starches, generally low VK" },
  { name: "dairy", count: 612, description: "Dairy products, near-zero VK" },
  { name: "beverages", count: 213, description: "Common beverages" },
  { name: "prepared_foods", count: 15, description: "Restaurant and fast food estimates (not USDA-verified)" },
  { name: "nuts_seeds", count: 148, description: "Nuts and seeds with varying VK" },
  { name: "other", count: 887, description: "Miscellaneous items" },
];

const discoveryEndpoints = [
  { path: "/.well-known/api-catalog", label: "API Catalog", spec: "RFC 9727", type: "linkset+json", desc: "Machine-readable API catalog describing endpoints, OpenAPI spec, and documentation" },
  { path: "/.well-known/openapi.json", label: "OpenAPI 3.1 Spec", spec: "OpenAPI 3.1", type: "application/openapi+json", desc: "Full OpenAPI specification for all x402 endpoints" },
  { path: "/.well-known/agent-skills", label: "Agent Skills Index", spec: "Agent Skills RFC v0.2", type: "application/json", desc: "Discoverable skill definitions with input schemas for AI agents" },
  { path: "/.well-known/mcp/server-card.json", label: "MCP Server Card", spec: "SEP-1649", type: "application/json", desc: "Model Context Protocol server card with tool definitions" },
  { path: "/.well-known/x402", label: "x402 Discovery", spec: "x402", type: "application/json", desc: "Payment protocol discovery — wallet, pricing, and endpoint info" },
  { path: "/.well-known/oauth-protected-resource", label: "OAuth Protected Resource", spec: "RFC 9728", type: "application/json", desc: "OAuth 2.0 protected resource metadata with authorization server info" },
  { path: "/.well-known/openid-configuration", label: "OpenID Connect Discovery", spec: "OIDC Core", type: "application/json", desc: "OpenID Connect configuration with auth/token/JWKS endpoints" },
  { path: "/.well-known/ai-plugin.json", label: "ChatGPT Plugin Manifest", spec: "OpenAI", type: "application/json", desc: "ChatGPT plugin manifest for GPT integration" },
  { path: "/llms.txt", label: "LLMs.txt", spec: "llmstxt.org", type: "text/plain", desc: "Human- and LLM-friendly project description and API overview" },
  { path: "/api-docs", label: "Documentation (this page)", spec: "HTML", type: "text/html", desc: "Human-readable API documentation you're reading now" },
];

export default function ApiDocsPage() {
  return (
    <>
      <PublicHeader />
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-sm text-blue-700 mb-4">
            🔌 Public API Available
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Vitamin K Food Data API
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            Programmatic access to our vitamin K food database. 7,793+ USDA-verified foods across 11 categories, available via REST API.
          </p>
          <p className="text-sm text-gray-500">
            Powered by x402 payment protocol · USDC on Base ·{" "}
            <code className="bg-gray-100 px-1 rounded text-xs">0xc406...</code>
          </p>
        </div>

        {/* Agent Discovery */}
        <section className="mb-12 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">🤖 Agent Discovery</h2>
          <p className="text-gray-600 mb-4">
            AI agents and LLMs can programmatically discover and authenticate with this API.
            All endpoints support CORS and return JSON with <code className="text-xs bg-white px-1 rounded">Access-Control-Allow-Origin: *</code>.
          </p>
          <p className="text-gray-500 text-sm mb-4">
            The homepage also advertises all discovery endpoints via RFC 8288 <code className="text-xs bg-white px-1 rounded">Link</code> response headers, and supports <code className="text-xs bg-white px-1 rounded">Accept: text/markdown</code> content negotiation.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-purple-200">
                  <th className="text-left py-2 px-2 text-purple-800">Endpoint</th>
                  <th className="text-left py-2 px-2 text-purple-800">Spec</th>
                  <th className="text-left py-2 px-2 text-purple-800">Purpose</th>
                </tr>
              </thead>
              <tbody>
                {discoveryEndpoints.map((ep) => (
                  <tr key={ep.path} className="border-b border-purple-100 last:border-0 hover:bg-white/50">
                    <td className="py-2 px-2">
                      <a href={ep.path} target="_blank" rel="noopener noreferrer" className="text-purple-600 font-mono text-xs hover:underline">
                        {ep.path}
                      </a>
                    </td>
                    <td className="py-2 px-2">
                      <span className="bg-purple-100 text-purple-700 text-xs px-1.5 py-0.5 rounded">{ep.spec}</span>
                    </td>
                    <td className="py-2 px-2 text-gray-600">{ep.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* WebMCP */}
        <section className="mb-12 p-6 bg-gradient-to-r from-green-50 to-teal-50 rounded-xl border border-green-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">🌐 WebMCP</h2>
          <p className="text-gray-600 mb-3">
            This site exposes tool definitions to AI agents via the browser using the WebMCP API
            (<code className="text-xs bg-white px-1 rounded">navigator.modelContext.provideContext()</code>).
            When you visit in a WebMCP-enabled browser, the following tools are registered:
          </p>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div className="bg-white p-3 rounded-lg border border-green-200">
              <code className="text-green-700 font-mono text-xs">search_vitamin_k_foods</code>
              <p className="text-gray-500 mt-1">Search foods by name or category</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-green-200">
              <code className="text-green-700 font-mono text-xs">get_food_details</code>
              <p className="text-gray-500 mt-1">Get food details with portion calculations</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-green-200">
              <code className="text-green-700 font-mono text-xs">calculate_vitamin_k</code>
              <p className="text-gray-500 mt-1">Calculate vitamin K for a portion</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-green-200">
              <code className="text-green-700 font-mono text-xs">export_food_data</code>
              <p className="text-gray-500 mt-1">Export food database as JSON</p>
            </div>
          </div>
          <p className="text-gray-400 text-xs mt-3">
            WebMCP is an emerging browser API. Tools are registered automatically when the browser supports it.
          </p>
        </section>

        {/* Markdown for Agents */}
        <section className="mb-12 p-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">📝 Markdown for Agents</h2>
          <p className="text-gray-600 mb-3">
            Request any page with <code className="text-xs bg-white px-1 rounded">Accept: text/markdown</code> to get a markdown representation:
          </p>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs font-mono overflow-x-auto">
            <div className="text-gray-500"># Homepage</div>
            curl -H &quot;Accept: text/markdown&quot; https://vitaktracker.com/<br />
            <br />
            <div className="text-gray-500"># API Docs</div>
            curl -H &quot;Accept: text/markdown&quot; https://vitaktracker.com/api-docs
          </div>
          <p className="text-gray-500 text-sm mt-3">
            Responses include <code className="text-xs bg-white px-1 rounded">Content-Type: text/markdown</code> and <code className="text-xs bg-white px-1 rounded">x-markdown-tokens</code> headers.
          </p>
        </section>

        {/* API Endpoints */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">API Endpoints</h2>
          <div className="space-y-8">
            {endpoints.map((ep) => (
              <div key={ep.path} className="border rounded-xl overflow-hidden">
                <div className="bg-gray-900 text-white px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">{ep.method}</span>
                    <code className="font-mono text-sm">{ep.path}</code>
                  </div>
                  <span className="bg-yellow-500 text-black text-sm font-bold px-3 py-1 rounded">{ep.price}</span>
                </div>
                <div className="p-6">
                  <p className="text-gray-600 mb-4">{ep.description}</p>
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Parameters</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-3">Parameter</th>
                            <th className="text-left py-2 px-3">Type</th>
                            <th className="text-left py-2 px-3">Required</th>
                            <th className="text-left py-2 px-3">Example</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ep.params.map((p) => (
                            <tr key={p.name} className="border-b last:border-0">
                              <td className="py-2 px-3 font-mono text-purple-600">{p.name}</td>
                              <td className="py-2 px-3">{p.type}</td>
                              <td className="py-2 px-3">{p.required ? "Yes" : "No"}</td>
                              <td className="py-2 px-3 text-gray-500">{p.example}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm text-purple-600 hover:text-purple-800">
                      Response example
                    </summary>
                    <pre className="mt-2 bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto">
                      {ep.response}
                    </pre>
                  </details>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Food Categories */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Food Categories</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {categories.filter(c => c.count > 0).map((cat) => (
              <div key={cat.name} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-gray-900">{cat.name.replace("_", " ")}</h3>
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">{cat.count} foods</span>
                </div>
                <p className="text-sm text-gray-500">{cat.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* x402 Payment */}
        <section className="mb-12 p-6 bg-gray-50 rounded-xl border">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">💳 x402 Payment Protocol</h2>
          <p className="text-gray-600 mb-4">
            API access uses the x402 protocol for per-request micropayments in USDC on the Base network.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-semibold text-gray-700">How it works</h3>
              <ol className="list-decimal list-inside text-gray-600 space-y-1 mt-2">
                <li>Request any API endpoint</li>
                <li>Receive HTTP 402 with payment details</li>
                <li>Send USDC to the wallet address</li>
                <li>Include payment proof in next request</li>
              </ol>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700">Payment Details</h3>
              <div className="mt-2 space-y-1 text-gray-600">
                <p><strong>Network:</strong> Base (Ethereum L2)</p>
                <p><strong>Currency:</strong> USDC</p>
                <p><strong>Wallet:</strong> <code className="text-xs bg-gray-200 px-1 rounded">0xc406fFf2Ce8b5dce517d03cd3531960eb2F6110d</code></p>
              </div>
            </div>
          </div>
        </section>

        {/* Authentication */}
        <section className="mb-12 p-6 bg-blue-50 rounded-xl border border-blue-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">🔐 Authentication</h2>
          <p className="text-gray-600 mb-4">
            Protected API endpoints (meal logging, credit tracking) use OAuth 2.0 via Clerk. AI agents can discover authentication details programmatically:
          </p>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div className="bg-white p-3 rounded-lg border border-blue-200">
              <code className="text-blue-700 font-mono text-xs">GET /.well-known/openid-configuration</code>
              <p className="text-gray-500 mt-1">OpenID Connect discovery — issuer, auth/token/JWKS endpoints</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-blue-200">
              <code className="text-blue-700 font-mono text-xs">GET /.well-known/oauth-protected-resource</code>
              <p className="text-gray-500 mt-1">RFC 9728 — which auth server issues tokens, supported scopes</p>
            </div>
          </div>
          <p className="text-gray-500 text-xs mt-3">
            Public food search and calculation endpoints are available without authentication via x402 payment.
            Meal logging and credit tracking require Clerk OAuth authentication.
          </p>
        </section>

        {/* Data Provenance */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Provenance</h2>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800 text-sm">
              <strong>⚠️ Medical Disclaimer:</strong> This API provides nutritional data for informational purposes only.
              Vitamin K values can vary based on cooking method, growing conditions, and food variety.
              Always consult your healthcare provider before making dietary changes while on warfarin.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-bold">✓ USDA Verified</span>
                <span className="text-lg font-bold">7,793 foods</span>
              </div>
              <p className="text-sm text-gray-600">
                Values verified against USDA FoodData Central SR Legacy data (nutrient ID 1185, phylloquinone).
                Each food includes an FDC ID for source verification.
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full font-bold">≈ Estimate</span>
                <span className="text-lg font-bold">51 foods</span>
              </div>
              <p className="text-sm text-gray-600">
                Approximate values for prepared foods, restaurant items, and foods with natural variation.
                Marked with <code>data_source: &quot;estimate&quot;</code> in the API response.
              </p>
            </div>
          </div>
        </section>

        {/* Links */}
        <div className="flex flex-wrap gap-4 text-sm">
          <Link href="/vitamin-k-foods-warfarin" className="text-purple-600 hover:underline">
            ← Food Guide
          </Link>
          <Link href="/vitamin-k-calculator" className="text-purple-600 hover:underline">
            Calculator
          </Link>
          <Link href="/warfarin-diet-tracker" className="text-purple-600 hover:underline">
            Diet Tracker
          </Link>
          <a href="/.well-known/api-catalog" className="text-purple-600 hover:underline" target="_blank" rel="noopener noreferrer">
            API Catalog
          </a>
          <a href="/.well-known/openapi.json" className="text-purple-600 hover:underline" target="_blank" rel="noopener noreferrer">
            OpenAPI Spec
          </a>
          <a href="/.well-known/x402" className="text-purple-600 hover:underline" target="_blank" rel="noopener noreferrer">
            x402 Discovery
          </a>
          <a href="/.well-known/agent-skills" className="text-purple-600 hover:underline" target="_blank" rel="noopener noreferrer">
            Agent Skills
          </a>
        </div>
      </main>
      <Footer />
    </>
  );
}