import { NextRequest, NextResponse } from "next/server";

/**
 * Markdown for Agents — Content Negotiation
 * Serves markdown representations of public pages when agents
 * request Accept: text/markdown, per the Markdown for Agents spec.
 * @see https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/
 */

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

const HOME_PAGE_MD = `# VitaK Tracker

> Vitamin K tracking for warfarin patients. Free PWA built on USDA FoodData Central data.

## What is VitaK Tracker?

A Progressive Web App that helps warfarin (Coumadin) patients manage their vitamin K intake through a credit-based system. Track daily, weekly, and monthly vitamin K consumption against personalized limits to maintain stable INR levels.

**Key features:**

- **Credit System** — Daily, weekly, and monthly Vitamin K budgets
- **89 Foods Database** — 38 USDA FoodData Central verified, 51 estimates
- **Per-100g Values** — All values standardized to mcg per 100g
- **Visual Charts** — Daily intake history, category breakdowns, progress indicators
- **Meal Presets** — Save frequent meals for quick logging
- **PWA** — Works offline, installable on mobile/desktop
- **Free** — No subscription, no ads, no paywall on core features

## How It Works

1. **Log Your Meals** — Search the food database (sourced from USDA data) and log what you ate. Portion sizes are calculated automatically.
2. **Watch Your Credits** — Daily, weekly, and monthly Vitamin K credits update in real time. Color-coded indicators at a glance.
3. **Stay Within Limits** — Alerts when you approach or exceed your limit. Charts showing trends over days, weeks, and months.

## Free Tools (No Account Required)

- **[Vitamin K Calculator](/vitamin-k-calculator)** — Calculate total Vitamin K in your meals
- **[Printable Food Chart](/warfarin-food-chart)** — Download a comprehensive Vitamin K food chart
- **[Vitamin K Foods Guide](/vitamin-k-foods-warfarin)** — Which foods to limit, moderate, and enjoy freely on warfarin
- **[Diet Tracker Guide](/warfarin-diet-tracker)** — How the credit system and tracking features work

## Public API (x402 Paid)

Programmatic access to vitamin K food data via REST API:

| Endpoint | Method | Cost | Description |
|---|---|---|---|
| \`/api/x402/food/search\` | GET | $0.001 | Search foods by name or category |
| \`/api/x402/food/{id}\` | GET | $0.001 | Get food details with portion calculations |
| \`/api/x402/calculate\` | POST | $0.002 | Calculate vitamin K for a food portion |
| \`/api/x402/food/export\` | GET | $0.05 | Export complete food database as JSON |

Payment via x402 protocol (USDC on Base network).

**Discovery endpoints:**

- \`GET /.well-known/openapi.json\` — OpenAPI 3.1 specification
- \`GET /.well-known/x402\` — x402 payment discovery
- \`GET /.well-known/ai-plugin.json\` — ChatGPT plugin manifest
- \`GET /.well-known/api-catalog\` — RFC 9727 API catalog
- \`GET /.well-known/agent-skills\` — Agent skills discovery index
- \`GET /.well-known/mcp/server-card.json\` — MCP server card
- \`GET /llms.txt\` — LLMs.txt project description

## Safety Notice

This tool is for informational purposes only. Warfarin dosing is medically sensitive — always consult your healthcare provider before making dietary changes. Vitamin K values are based on USDA data but individual food items may vary. The app rounds UP vitamin K calculations (ceil) to be conservative for patient safety.

## Data Provenance

- **USDA Verified (38 foods):** Values verified against USDA FoodData Central SR Legacy data (nutrient ID 1185, phylloquinone). Each food includes an FDC ID for source verification.
- **Estimates (51 foods):** Approximate values for prepared foods, restaurant items, and foods with natural variation. Marked with \`data_source: "estimate"\` in the API.
`;

const API_DOCS_MD = `# VitaK Tracker API — Developer Documentation

> Programmatic access to vitamin K food data via REST API with x402 payment protocol.

## Quick Start for AI Agents

| Endpoint | Description |
|---|---|
| \`GET /.well-known/openapi.json\` | OpenAPI 3.1 specification |
| \`GET /.well-known/x402\` | x402 payment discovery |
| \`GET /.well-known/ai-plugin.json\` | ChatGPT plugin manifest |
| \`GET /.well-known/api-catalog\` | RFC 9727 API catalog |

## API Endpoints

### Search Foods

\`\`\`
GET /api/x402/food/search?query=spinach&category=vegetables&limit=20
Cost: $0.001
\`\`\`

### Get Food by ID

\`\`\`
GET /api/x402/food/{id}
Cost: $0.001
\`\`\`

### Calculate Vitamin K

\`\`\`
POST /api/x402/calculate
Body: { "food_id": "abc123", "portion_size_g": 180 }
Cost: $0.002
\`\`\`

### Export Database

\`\`\`
GET /api/x402/food/export?category=vegetables&source=usda_fdc_sr_legacy
Cost: $0.05
\`\`\`

## Payment (x402 Protocol)

All API access uses HTTP 402 payment protocol with USDC on Base network.

1. Request any API endpoint
2. Receive HTTP 402 with payment details
3. Send USDC to wallet address
4. Include payment proof in next request

**Network:** Base (Ethereum L2)
**Currency:** USDC
**Wallet:** \`0xc406fFf2Ce8b5dce517d03cd3531960eb2F6110d\`

## Food Categories

| Category | Count | Description |
|---|---|---|
| vegetables | 1,480 | Leafy greens, cruciferous vegetables |
| herbs_spices | 63 | Fresh herbs with high VK concentration |
| fruits | 696 | Fruits with moderate to low VK |
| proteins | 2,992 | Protein sources, most near-zero VK |
| fats_oils | 287 | Cooking oils with varying VK |
| grains | 480 | Grains and starches, generally low VK |
| dairy | 612 | Dairy products, near-zero VK |
| beverages | 213 | Common beverages |
| prepared_foods | 15 | Restaurant and fast food estimates |
| nuts_seeds | 148 | Nuts and seeds with varying VK |
| other | 887 | Miscellaneous items |

## Medical Disclaimer

Vitamin K values can vary based on cooking method, growing conditions, and food variety. Always consult your healthcare provider before making dietary changes while on warfarin.
`;

function getMarkdownForPath(path: string): { content: string; tokens: number } | null {
  const routes: Record<string, string> = {
    "/": HOME_PAGE_MD,
    "/api-docs": API_DOCS_MD,
  };

  const content = routes[path];
  if (!content) return null;
  return { content, tokens: estimateTokens(content) };
}

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path") || "/";
  const md = getMarkdownForPath(path);

  if (!md) {
    return NextResponse.json(
      { error: "No markdown representation available for this path", path },
      { status: 404 }
    );
  }

  return new NextResponse(md.content, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "x-markdown-tokens": md.tokens.toString(),
      "Cache-Control": "public, max-age=3600",
    },
  });
}