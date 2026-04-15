export const dynamic = "force-dynamic";

import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Footer } from "@/components/ui/footer";
import { PublicHeader } from "@/components/ui/public-header";
import { PrintButton } from "@/components/ui/print-button";
import { AlertCircle } from "lucide-react";
import { BreadcrumbLD } from "@/components/seo/json-ld";
import { getDb } from "@/lib/db";
import { foods } from "@/lib/db/schema";
import { sql, or } from "drizzle-orm";

export const metadata: Metadata = {
  title: "Warfarin Food Chart - Printable Vitamin K Food List | 7,800+ USDA Foods",
  description:
    "Free printable warfarin food chart with USDA-verified vitamin K values. 7,800+ foods organized by VK level for easy meal planning and grocery shopping.",
  keywords: [
    "warfarin food chart",
    "vitamin k food list pdf",
    "printable warfarin diet",
    "coumadin food chart",
    "blood thinner food list",
  ],
  alternates: { canonical: "/warfarin-food-chart" },
  openGraph: {
    title: "Printable Warfarin Food Chart - Vitamin K Content Guide",
    description: "Download or print our USDA-based vitamin K food chart for educational reference",
    type: "article",
  },
};

// ─── Curated chart foods ────────────────────────────────────────
// These are the foods warfarin patients actually need on a chart.
// We query D1 for these specific patterns to get accurate USDA values.

interface ChartFood {
  pattern: string;
  category: string;
}

const CHART_FOODS: ChartFood[] = [
  // ── Very High VK (>100 mcg/serving) ──
  { pattern: "Kale, raw", category: "vegetables" },
  { pattern: "Kale, cooked", category: "vegetables" },
  { pattern: "Spinach, raw", category: "vegetables" },
  { pattern: "Spinach, cooked", category: "vegetables" },
  { pattern: "Collard", category: "vegetables" },
  { pattern: "Swiss chard", category: "vegetables" },
  { pattern: "Broccoli, cooked", category: "vegetables" },
  { pattern: "Brussels sprouts, raw", category: "vegetables" },
  { pattern: "Turnip greens", category: "vegetables" },
  { pattern: "Mustard greens", category: "vegetables" },
  { pattern: "Beet greens", category: "vegetables" },
  { pattern: "Parsley, fresh", category: "herbs_spices" },
  { pattern: "Dandelion greens", category: "vegetables" },
  // ── High VK (20-100 mcg/serving) ──
  { pattern: "Romaine lettuce", category: "vegetables" },
  { pattern: "Cabbage, raw", category: "vegetables" },
  { pattern: "Green beans, raw", category: "vegetables" },
  { pattern: "Asparagus, raw", category: "vegetables" },
  { pattern: "Peas, green, raw", category: "vegetables" },
  { pattern: "Blueberries, raw", category: "fruits" },
  { pattern: "Kiwi", category: "fruits" },
  { pattern: "Avocado, raw", category: "fruits" },
  { pattern: "Basil, fresh", category: "herbs_spices" },
  { pattern: "Soybean oil", category: "fats_oils" },
  { pattern: "Canola oil", category: "fats_oils" },
  // ── Moderate VK (5-20 mcg/serving) ──
  { pattern: "Iceberg lettuce", category: "vegetables" },
  { pattern: "Olive oil", category: "fats_oils" },
  { pattern: "Grapes, raw", category: "fruits" },
  { pattern: "Celery, raw", category: "vegetables" },
  { pattern: "Carrot, raw", category: "vegetables" },
  { pattern: "Tomato, raw", category: "vegetables" },
  { pattern: "Cucumber, raw", category: "vegetables" },
  { pattern: "Mayonnaise", category: "fats_oils" },
  { pattern: "Cashew", category: "nuts_seeds" },
  // ── Low VK (<5 mcg/serving) ──
  { pattern: "Chicken, breast", category: "proteins" },
  { pattern: "Egg, whole, raw", category: "proteins" },
  { pattern: "Rice, white, cooked", category: "grains" },
  { pattern: "Milk, whole", category: "dairy" },
  { pattern: "Banana, raw", category: "fruits" },
  { pattern: "Apple, raw", category: "fruits" },
  { pattern: "Orange, raw", category: "fruits" },
  { pattern: "Butter", category: "dairy" },
  { pattern: "Bread, wheat", category: "grains" },
  { pattern: "Pasta, cooked", category: "grains" },
  { pattern: "Cheese, cheddar", category: "dairy" },
  { pattern: "Potato, raw", category: "vegetables" },
  { pattern: "Onion, raw", category: "vegetables" },
];

interface FoodChartItem {
  name: string;
  vitaminK: string;
  portion: string;
}

interface FoodCategory {
  category: string;
  color: string;
  foods: FoodChartItem[];
}

async function get_food_chart(): Promise<FoodCategory[]> {
  try {
    const db = await getDb();

    const conditions = CHART_FOODS.map(
      (f) => sql`(${foods.name} LIKE ${"%" + f.pattern + "%"} AND ${foods.category} = ${f.category})`
    );

    const data = await db
      .select({
        name: foods.name,
        vitaminKMcgPer100g: foods.vitaminKMcgPer100g,
        commonPortionSizeG: foods.commonPortionSizeG,
        commonPortionName: foods.commonPortionName,
        category: foods.category,
      })
      .from(foods)
      .where(or(...conditions))
      .orderBy(foods.name)
      .all();

    if (!data || data.length === 0) return get_fallback_categories();

    // Deduplicate: shortest name per pattern
    const bestMatch = new Map<
      string,
      {
        name: string;
        vitaminKMcgPer100g: number;
        commonPortionSizeG: number | null;
        commonPortionName: string | null;
      }
    >();

    for (const row of data) {
      const matched = CHART_FOODS.find(
        (f) => row.name.toLowerCase().includes(f.pattern.toLowerCase()) && row.category === f.category
      );
      if (!matched) continue;
      const key = matched.pattern;
      const existing = bestMatch.get(key);
      if (!existing || row.name.length < existing.name.length) {
        bestMatch.set(key, {
          name: row.name,
          vitaminKMcgPer100g: row.vitaminKMcgPer100g,
          commonPortionSizeG: row.commonPortionSizeG,
          commonPortionName: row.commonPortionName,
        });
      }
    }

    // Build chart items
    const chartItems = Array.from(bestMatch.entries()).map(([key, food]) => {
      const portionG = food.commonPortionSizeG ?? 100;
      const portionName = food.commonPortionName ?? "1 serving";
      const vkPerServing = Math.ceil((food.vitaminKMcgPer100g * portionG) / 100);

      return {
        pattern: key,
        name: food.name,
        portion: `${portionName} (${portionG}g)`,
        vkPerServing,
        vkPer100g: food.vitaminKMcgPer100g,
      };
    });

    // Categorize by per-serving VK
    const veryHigh = chartItems.filter((f) => f.vkPerServing > 100).sort((a, b) => b.vkPerServing - a.vkPerServing);
    const high = chartItems.filter((f) => f.vkPerServing >= 20 && f.vkPerServing <= 100).sort((a, b) => b.vkPerServing - a.vkPerServing);
    const moderate = chartItems.filter((f) => f.vkPerServing >= 5 && f.vkPerServing < 20).sort((a, b) => b.vkPerServing - a.vkPerServing);
    const low = chartItems.filter((f) => f.vkPerServing < 5).sort((a, b) => b.vkPerServing - a.vkPerServing);

    return [
      {
        category: "Very High Vitamin K (>100 mcg per serving)",
        color: "bg-red-50 border-red-200",
        foods: veryHigh.map((f) => ({ name: f.name, portion: f.portion, vitaminK: `${f.vkPerServing} mcg` })),
      },
      {
        category: "High Vitamin K (20–100 mcg per serving)",
        color: "bg-orange-50 border-orange-200",
        foods: high.map((f) => ({ name: f.name, portion: f.portion, vitaminK: `${f.vkPerServing} mcg` })),
      },
      {
        category: "Moderate Vitamin K (5–20 mcg per serving)",
        color: "bg-yellow-50 border-yellow-200",
        foods: moderate.map((f) => ({ name: f.name, portion: f.portion, vitaminK: `${f.vkPerServing} mcg` })),
      },
      {
        category: "Low Vitamin K (<5 mcg per serving)",
        color: "bg-green-50 border-green-200",
        foods: low.map((f) => ({ name: f.name, portion: f.portion, vitaminK: `${f.vkPerServing} mcg` })),
      },
    ].filter((cat) => cat.foods.length > 0);
  } catch (error) {
    console.error("Error fetching food chart:", error);
    return get_fallback_categories();
  }
}

function get_fallback_categories(): FoodCategory[] {
  return [
    {
      category: "Very High Vitamin K (>100 mcg per serving)",
      color: "bg-red-50 border-red-200",
      foods: [
        { name: "Kale (cooked)", portion: "1 cup (130g)", vitaminK: "715 mcg" },
        { name: "Spinach (cooked)", portion: "1 cup (180g)", vitaminK: "890 mcg" },
        { name: "Collard greens (cooked)", portion: "1 cup (170g)", vitaminK: "692 mcg" },
        { name: "Swiss chard (raw)", portion: "1 cup (36g)", vitaminK: "299 mcg" },
        { name: "Broccoli (cooked)", portion: "1 cup (156g)", vitaminK: "220 mcg" },
        { name: "Brussels sprouts (raw)", portion: "1 cup (88g)", vitaminK: "156 mcg" },
        { name: "Parsley (fresh)", portion: "1 cup (60g)", vitaminK: "984 mcg" },
      ],
    },
    {
      category: "High Vitamin K (20–100 mcg per serving)",
      color: "bg-orange-50 border-orange-200",
      foods: [
        { name: "Romaine lettuce", portion: "1 cup (47g)", vitaminK: "48 mcg" },
        { name: "Cabbage (raw)", portion: "1 cup (89g)", vitaminK: "68 mcg" },
        { name: "Green beans (raw)", portion: "1 cup (100g)", vitaminK: "43 mcg" },
        { name: "Blueberries (raw)", portion: "1 cup (148g)", vitaminK: "29 mcg" },
        { name: "Avocado (raw)", portion: "1/2 avocado (68g)", vitaminK: "21 mcg" },
      ],
    },
    {
      category: "Moderate Vitamin K (5–20 mcg per serving)",
      color: "bg-yellow-50 border-yellow-200",
      foods: [
        { name: "Iceberg lettuce", portion: "1 cup (55g)", vitaminK: "9 mcg" },
        { name: "Olive oil", portion: "1 tbsp (14g)", vitaminK: "8 mcg" },
        { name: "Grapes (raw)", portion: "1 cup (151g)", vitaminK: "14 mcg" },
        { name: "Carrot (raw)", portion: "1 medium (61g)", vitaminK: "8 mcg" },
        { name: "Tomato (raw)", portion: "1 medium (123g)", vitaminK: "10 mcg" },
      ],
    },
    {
      category: "Low Vitamin K (<5 mcg per serving)",
      color: "bg-green-50 border-green-200",
      foods: [
        { name: "Chicken breast", portion: "3 oz (85g)", vitaminK: "0 mcg" },
        { name: "Egg (whole)", portion: "1 large (50g)", vitaminK: "0 mcg" },
        { name: "White rice (cooked)", portion: "1 cup (158g)", vitaminK: "0 mcg" },
        { name: "Milk (whole)", portion: "1 cup (244g)", vitaminK: "0 mcg" },
        { name: "Banana (raw)", portion: "1 medium (118g)", vitaminK: "1 mcg" },
        { name: "Apple (raw)", portion: "1 medium (182g)", vitaminK: "4 mcg" },
        { name: "Butter", portion: "1 tbsp (14g)", vitaminK: "1 mcg" },
      ],
    },
  ];
}

export default async function WarfarinFoodChartPage() {
  const food_categories = await get_food_chart();

  return (
    <>
      <BreadcrumbLD
        items={[
          { name: "Home", url: "/" },
          { name: "Warfarin Food Chart", url: "/warfarin-food-chart" },
        ]}
      />

      <div className="min-h-screen bg-gray-50 print:bg-white">
        <div className="print:hidden">
          <PublicHeader />
        </div>

        <main className="container mx-auto px-4 py-8 print:py-4">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8 print:mb-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-green-50 border border-green-200 px-3 py-1 text-sm text-green-700 mb-4 print:hidden">
                🥬 Based on USDA FoodData Central
              </div>
              <h1 className="text-4xl font-bold mb-4 print:text-2xl">Warfarin Food Chart</h1>
              <p className="text-xl text-gray-600 print:text-base">
                Printable vitamin K content guide for common foods. Values are per-serving, ceiling-rounded for safety.
              </p>
              <div className="mt-4 flex gap-2 print:hidden">
                <PrintButton>Print This Chart</PrintButton>
              </div>
            </div>

            {/* Disclaimer */}
            <Card className="mb-6 print:shadow-none print:border-2">
              <CardHeader className="print:pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  Important Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm print:text-xs">
                  This chart is for educational reference only and is based on data from USDA FoodData Central (SR Legacy). Vitamin K content can
                  vary based on preparation methods and serving sizes. Always consult your healthcare provider about your specific dietary
                  requirements while taking warfarin. VK values are per-serving, ceiling-rounded for safety.
                </p>
              </CardContent>
            </Card>

            {/* Chart categories */}
            <div className="space-y-6 print:space-y-4">
              {food_categories.map((category, index) => (
                <Card key={index} className={`${category.color} print:break-inside-avoid print:border-2`}>
                  <CardHeader className="print:pb-2">
                    <CardTitle className="text-xl print:text-lg">{category.category}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 print:gap-1">
                      {category.foods.map((food, foodIndex) => (
                        <div
                          key={foodIndex}
                          className="flex justify-between items-center p-2 bg-white rounded print:p-1 print:text-sm"
                        >
                          <div>
                            <span className="font-medium">{food.name}</span>
                            <span className="text-gray-500 text-sm ml-1 print:text-xs">({food.portion})</span>
                          </div>
                          <span className="text-gray-600 font-mono text-sm print:font-semibold">
                            {food.vitaminK}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Tips */}
            <Card className="mt-8 print:mt-4 print:break-inside-avoid">
              <CardHeader>
                <CardTitle>Tips for Consistent Vitamin K Intake</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm print:text-xs">
                  <li>• Eat the same amount of vitamin K daily rather than avoiding it completely</li>
                  <li>• Keep a food diary to track your vitamin K intake</li>
                  <li>• Be consistent with portion sizes of high vitamin K foods</li>
                  <li>• Notify your doctor before making major dietary changes</li>
                  <li>• Check labels on multivitamins and supplements for vitamin K content</li>
                </ul>
              </CardContent>
            </Card>

            {/* CTA */}
            <div className="mt-8 text-center print:hidden">
              <p className="text-gray-600 mb-4">
                Want to automatically track your vitamin K intake?
              </p>
              <Link href="/auth/sign-up">
                <Button size="lg">Sign Up for Free Tracking</Button>
              </Link>
            </div>

            {/* Print footer */}
            <div className="mt-4 text-center text-sm text-gray-500 print:block hidden">
              <p>Chart provided by VitaK Tracker — vitaktracker.com</p>
              <p>Nutritional data sourced from USDA FoodData Central (SR Legacy)</p>
              <p>Date printed: {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </main>

        <Footer />
      </div>

      {/* Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: "Warfarin Food Chart - Vitamin K Content Guide",
            description: "Comprehensive printable chart showing vitamin K content in common foods for warfarin patients",
            author: { "@type": "Organization", name: "VitaK Tracker" },
            publisher: {
              "@type": "Organization",
              name: "VitaK Tracker",
              logo: {
                "@type": "ImageObject",
                url: `${process.env.NEXT_PUBLIC_APP_URL}/icon-512x512.svg`,
              },
            },
            datePublished: new Date().toISOString(),
            dateModified: new Date().toISOString(),
          }),
        }}
      />
    </>
  );
}