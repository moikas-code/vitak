import { Metadata } from "next";
import { Footer } from "@/components/ui/footer";
import { PublicHeader } from "@/components/ui/public-header";
import { BreadcrumbLD } from "@/components/seo/json-ld";
import { VitaminKCalculatorClient } from "@/components/vitamin-k-calculator-client";
import { getDb } from "@/lib/db";
import { foods } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const revalidate = 3600; // Revalidate hourly

export const metadata: Metadata = {
  title: "Free Vitamin K Calculator - Calculate mcg for Warfarin Patients",
  description:
    "Calculate vitamin K content in your meals with our free calculator. 7,800+ USDA-verified foods. Perfect for warfarin patients managing daily vitamin K intake.",
  keywords: [
    "vitamin k calculator",
    "warfarin vitamin k calculator",
    "coumadin food calculator",
    "calculate vitamin k mcg",
    "vitamin k counter",
    "warfarin diet calculator",
  ],
  openGraph: {
    title: "Vitamin K Calculator for Warfarin Patients",
    description:
      "Free tool to calculate total vitamin K content in meals from 7,800+ USDA-verified foods. Essential for warfarin management.",
    type: "website",
  },
};

// Curated common foods — match patterns for USDA SR Legacy naming
const CURATED_FOODS: { pattern: string; category: string }[] = [
  // High VK greens
  { pattern: "Kale, raw", category: "vegetables" },
  { pattern: "Kale, cooked", category: "vegetables" },
  { pattern: "Spinach, raw", category: "vegetables" },
  { pattern: "Spinach, cooked", category: "vegetables" },
  { pattern: "Collard", category: "vegetables" },
  { pattern: "Swiss chard, raw", category: "vegetables" },
  { pattern: "Broccoli, raw", category: "vegetables" },
  { pattern: "Broccoli, cooked", category: "vegetables" },
  { pattern: "Brussels sprouts, raw", category: "vegetables" },
  { pattern: "Romaine lettuce, raw", category: "vegetables" },
  { pattern: "Cabbage, raw", category: "vegetables" },
  { pattern: "Asparagus, raw", category: "vegetables" },
  { pattern: "Green beans, raw", category: "vegetables" },
  { pattern: "Parsley, fresh", category: "herbs_spices" },
  // Moderate VK
  { pattern: "Avocado", category: "fruits" },
  { pattern: "Peas, green, raw", category: "vegetables" },
  { pattern: "Kiwi", category: "fruits" },
  { pattern: "Blueberries, raw", category: "fruits" },
  // Low VK staples
  { pattern: "Chicken, breast", category: "proteins" },
  { pattern: "Egg, whole, raw", category: "proteins" },
  { pattern: "Rice, white, cooked", category: "grains" },
  { pattern: "Milk, whole", category: "dairy" },
  { pattern: "Banana, raw", category: "fruits" },
  { pattern: "Tomato, raw", category: "vegetables" },
  { pattern: "Carrot, raw", category: "vegetables" },
  { pattern: "Apple, raw", category: "fruits" },
  // Oils
  { pattern: "Soybean oil", category: "fats_oils" },
  { pattern: "Canola oil", category: "fats_oils" },
  { pattern: "Olive oil", category: "fats_oils" },
  { pattern: "Butter", category: "dairy" },
];

export default async function VitaminKCalculatorPage() {
  interface CommonFood {
    id: string | number;
    name: string;
    vitamin_k_mcg_per_100g: number;
    category: string | null;
    common_portion_name: string | null;
    common_portion_size_g: number | null;
  }

  let commonFoods: CommonFood[] = [];

  try {
    const db = await getDb();

    // Build a query that matches the curated food names with prefix matching
    // Using UNION of individual LIKE queries to get the best match per food
    const conditions = CURATED_FOODS.map(
      (f) => sql`(${foods.name} LIKE ${"%" + f.pattern + "%"} AND ${foods.category} = ${f.category})`
    );

    const data = await db
      .select({
        id: foods.id,
        name: foods.name,
        vitamin_k_mcg_per_100g: foods.vitaminKMcgPer100g,
        category: foods.category,
        common_portion_name: foods.commonPortionName,
        common_portion_size_g: foods.commonPortionSizeG,
      })
      .from(foods)
      .where(sql.join(conditions, " OR "))
      .orderBy(foods.name)
      .all();

    if (data && data.length > 0) {
      // Deduplicate per pattern: keep the shortest matching name per curated food
      const bestMatch = new Map<string, CommonFood>();
      for (const row of data) {
        const matchedPattern = CURATED_FOODS.find(f =>
          row.name.toLowerCase().includes(f.pattern.toLowerCase()) && row.category === f.category
        );
        if (!matchedPattern) continue;
        const key = matchedPattern.pattern;
        const existing = bestMatch.get(key);
        if (!existing || row.name.length < existing.name.length) {
          bestMatch.set(key, {
            id: row.id as string | number,
            name: row.name,
            vitamin_k_mcg_per_100g: row.vitamin_k_mcg_per_100g,
            category: row.category,
            common_portion_name: row.common_portion_name,
            common_portion_size_g: row.common_portion_size_g,
          });
        }
      }
      commonFoods = Array.from(bestMatch.values());
    }
  } catch (error) {
    console.error("Failed to fetch common foods:", error);
    // Fallback with accurate USDA-verified values
    commonFoods = [
      { id: 0, name: "Spinach, raw", vitamin_k_mcg_per_100g: 483, category: "vegetables", common_portion_name: "1 cup", common_portion_size_g: 30 },
      { id: 0, name: "Spinach, cooked", vitamin_k_mcg_per_100g: 494, category: "vegetables", common_portion_name: "1 cup", common_portion_size_g: 180 },
      { id: 0, name: "Kale, raw", vitamin_k_mcg_per_100g: 390, category: "vegetables", common_portion_name: "1 cup", common_portion_size_g: 21 },
      { id: 0, name: "Broccoli, cooked", vitamin_k_mcg_per_100g: 141, category: "vegetables", common_portion_name: "1 cup", common_portion_size_g: 156 },
      { id: 0, name: "Romaine lettuce, raw", vitamin_k_mcg_per_100g: 102, category: "vegetables", common_portion_name: "1 cup", common_portion_size_g: 47 },
      { id: 0, name: "Cabbage, raw", vitamin_k_mcg_per_100g: 76, category: "vegetables", common_portion_name: "1 cup", common_portion_size_g: 89 },
      { id: 0, name: "Chicken, breast", vitamin_k_mcg_per_100g: 0.3, category: "proteins", common_portion_name: "1 breast", common_portion_size_g: 172 },
      { id: 0, name: "Egg, whole, raw", vitamin_k_mcg_per_100g: 0.3, category: "proteins", common_portion_name: "1 large", common_portion_size_g: 50 },
      { id: 0, name: "Rice, white, cooked", vitamin_k_mcg_per_100g: 0, category: "grains", common_portion_name: "1 cup", common_portion_size_g: 158 },
      { id: 0, name: "Banana, raw", vitamin_k_mcg_per_100g: 0.5, category: "fruits", common_portion_name: "1 medium", common_portion_size_g: 118 },
    ];
  }

  return (
    <>
      <BreadcrumbLD
        items={[
          { name: "Home", url: "/" },
          { name: "Vitamin K Calculator", url: "/vitamin-k-calculator" },
        ]}
      />

      <div className="min-h-screen bg-gray-50">
        <PublicHeader />
        <VitaminKCalculatorClient commonFoods={commonFoods} />
        <Footer />
      </div>

      {/* HowTo Schema for Calculator */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "HowTo",
            name: "How to Calculate Vitamin K Content in Your Meals",
            description:
              "Use our vitamin K calculator to determine the total vitamin K content in your meals for warfarin management",
            step: [
              {
                "@type": "HowToStep",
                name: "Select foods",
                text: "Choose foods from the common foods list or add custom foods",
              },
              {
                "@type": "HowToStep",
                name: "Adjust portions",
                text: "Enter the portion size in grams for each food item",
              },
              {
                "@type": "HowToStep",
                name: "View total",
                text: "The calculator automatically shows total vitamin K content",
              },
            ],
            tool: {
              "@type": "HowToTool",
              name: "VitaK Tracker Vitamin K Calculator",
            },
          }),
        }}
      />
    </>
  );
}