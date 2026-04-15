import { Metadata } from "next";
import { Footer } from "@/components/ui/footer";
import { PublicHeader } from "@/components/ui/public-header";
import Link from "next/link";
import { getDb } from "@/lib/db";
import { foods } from "@/lib/db/schema";
import { desc, sql, eq } from "drizzle-orm";

export const metadata: Metadata = {
  title: "Vitamin K Foods List for Warfarin Patients — 7,800+ Foods | VitaK Tracker",
  description:
    "Complete vitamin K food database for warfarin patients. Browse 7,800+ foods with USDA-verified vitamin K values per 100g. Filter by category and VK content level.",
  openGraph: {
    title: "Vitamin K Foods Guide — 7,800+ Foods",
    description: "Browse USDA-verified vitamin K values for warfarin diet management.",
  },
};

// ─── Data fetching ──────────────────────────────────────────────

async function getFoodsByLevel() {
  const db = await getDb();

  // High VK: >100 mcg/100g
  const highVk = await db
    .select({
      id: foods.id,
      name: foods.name,
      vitaminK: foods.vitaminKMcgPer100g,
      category: foods.category,
      portionGrams: foods.commonPortionSizeG,
      portionName: foods.commonPortionName,
      calories: foods.caloriesPer100g,
      fdcId: foods.fdcId,
      dataSource: foods.dataSource,
    })
    .from(foods)
    .where(sql`vitamin_k_mcg_per_100g > 100`)
    .orderBy(desc(foods.vitaminKMcgPer100g))
    .limit(150);

  // Moderate VK: 20-100 mcg/100g
  const moderateVk = await db
    .select({
      id: foods.id,
      name: foods.name,
      vitaminK: foods.vitaminKMcgPer100g,
      category: foods.category,
      portionGrams: foods.commonPortionSizeG,
      portionName: foods.commonPortionName,
      calories: foods.caloriesPer100g,
      fdcId: foods.fdcId,
      dataSource: foods.dataSource,
    })
    .from(foods)
    .where(sql`vitamin_k_mcg_per_100g BETWEEN 20 AND 100`)
    .orderBy(desc(foods.vitaminKMcgPer100g))
    .limit(150);

  // Low VK: <20 mcg/100g (sample)
  const lowVk = await db
    .select({
      id: foods.id,
      name: foods.name,
      vitaminK: foods.vitaminKMcgPer100g,
      category: foods.category,
      portionGrams: foods.commonPortionSizeG,
      portionName: foods.commonPortionName,
      calories: foods.caloriesPer100g,
      fdcId: foods.fdcId,
      dataSource: foods.dataSource,
    })
    .from(foods)
    .where(sql`vitamin_k_mcg_per_100g > 0 AND vitamin_k_mcg_per_100g < 20`)
    .orderBy(desc(foods.vitaminKMcgPer100g))
    .limit(100);

  // Zero VK
  const zeroVkCount = await db
    .select({ cnt: sql<number>`count(*)` })
    .from(foods)
    .where(eq(foods.vitaminKMcgPer100g, 0));

  // Total counts
  const totalFoods = await db.select({ cnt: sql<number>`count(*)` }).from(foods);
  const usdaCount = await db
    .select({ cnt: sql<number>`count(*)` })
    .from(foods)
    .where(eq(foods.dataSource, "usda_fdc_sr_legacy"));

  // Category summary
  const categoryCounts = await db
    .select({
      category: foods.category,
      count: sql<number>`count(*)`,
      avgVk: sql<number>`ROUND(AVG(vitamin_k_mcg_per_100g), 1)`,
    })
    .from(foods)
    .where(sql`vitamin_k_mcg_per_100g > 0`)
    .groupBy(foods.category)
    .orderBy(sql`avg(vitamin_k_mcg_per_100g) DESC`);

  return {
    highVk,
    moderateVk,
    lowVk,
    zeroVkCount: zeroVkCount[0]?.cnt ?? 0,
    totalFoods: totalFoods[0]?.cnt ?? 0,
    usdaFoods: usdaCount[0]?.cnt ?? 0,
    categoryCounts,
  };
}

// ─── Component ──────────────────────────────────────────────────

function FoodRow({ food }: { food: { name: string; vitaminK: number; portionName: string; portionGrams: number; calories: number | null; dataSource: string | null } }) {
  const portionVk = Math.ceil((food.portionGrams / 100) * food.vitaminK);
  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      <td className="py-2 px-3 text-sm">{food.name}</td>
      <td className="py-2 px-3 text-sm text-right font-mono">{food.vitaminK}</td>
      <td className="py-2 px-3 text-sm text-right font-mono">{portionVk}</td>
      <td className="py-2 px-3 text-sm text-gray-500">
        {food.portionName} ({food.portionGrams}g)
      </td>
      <td className="py-2 px-3 text-xs">
        {food.calories != null ? `${food.calories}` : "—"}
      </td>
      <td className="py-2 px-3">
        {food.dataSource === "usda_fdc_sr_legacy" ? (
          <span className="bg-green-100 text-green-800 text-xs px-1.5 py-0.5 rounded">USDA</span>
        ) : (
          <span className="bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded">Est.</span>
        )}
      </td>
    </tr>
  );
}

function FoodTable({ foods: foodList, showPortionVk = true }: { foods: ReturnType<typeof getFoodsByLevel> extends Promise<{ highVk: infer T }> ? T : never; showPortionVk?: boolean }) {
  if (!foodList || foodList.length === 0) return null;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b-2 border-gray-200">
            <th className="py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Food</th>
            <th className="py-2 px-3 text-xs font-semibold text-gray-500 uppercase text-right">VK/100g</th>
            {showPortionVk && (
              <th className="py-2 px-3 text-xs font-semibold text-gray-500 uppercase text-right">VK/portion</th>
            )}
            <th className="py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Portion</th>
            <th className="py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Cal/100g</th>
            <th className="py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Source</th>
          </tr>
        </thead>
        <tbody>
          {foodList.map((f: any) => <FoodRow key={f.id} food={f} />)}
        </tbody>
      </table>
    </div>
  );
}

export default async function VitaminKFoodsPage() {
  const data = await getFoodsByLevel();

  return (
    <>
      <PublicHeader />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Hero */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-green-50 border border-green-200 px-3 py-1 text-sm text-green-700 mb-4">
            🥬 {data.totalFoods.toLocaleString()} foods in database
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Vitamin K Foods List for Warfarin Patients
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            Complete food database with USDA-verified vitamin K values.
            <strong> The key is consistency</strong>, not avoidance — most patients can safely consume 70–120 mcg daily.
          </p>
          <p className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            ⚠️ <strong>Medical Disclaimer:</strong> This guide is for educational purposes only.
            Always consult your healthcare provider before making dietary changes while on warfarin.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900">{data.totalFoods.toLocaleString()}</div>
            <div className="text-sm text-gray-500">Total foods</div>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">{data.usdaFoods.toLocaleString()}</div>
            <div className="text-sm text-gray-500">USDA-verified</div>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{(data.highVk.length + data.moderateVk.length + data.lowVk.length).toLocaleString()}</div>
            <div className="text-sm text-gray-500">With vitamin K data</div>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-400">{data.zeroVkCount.toLocaleString()}</div>
            <div className="text-sm text-gray-500">Zero VK (safe)</div>
          </div>
        </div>

        {/* Category Summary */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Foods with Vitamin K by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {data.categoryCounts.map((cat: any) => (
              <div key={cat.category} className="border rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {String(cat.category).replace(/_/g, " ")}
                  </span>
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                    {cat.count}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Avg: {cat.avgVk} mcg/100g
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Understanding VK */}
        <section className="mb-8 bg-gray-50 rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Understanding Vitamin K &amp; Warfarin</h2>
          <p className="text-gray-600 mb-4">
            Vitamin K plays a crucial role in blood clotting. Warfarin (Coumadin) works by reducing
            vitamin K&apos;s effectiveness, preventing dangerous blood clots. Consuming <strong>consistent
            amounts</strong> of vitamin K helps maintain stable INR levels and ensures your warfarin dose
            remains effective.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-800 mb-1">🔴 High VK (&gt;100 mcg/100g)</h3>
              <p className="text-sm text-red-700">
                {data.highVk.length} foods. Limit or maintain very consistent intake. These can significantly affect INR if intake varies.
              </p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-1">🟡 Moderate (20–100 mcg/100g)</h3>
              <p className="text-sm text-yellow-700">
                {data.moderateVk.length} foods. Enjoy in moderation with consistent daily intake.
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-1">🟢 Low (&lt;20 mcg/100g)</h3>
              <p className="text-sm text-green-700">
                {data.lowVk.length}+ foods. Generally safe to eat freely without affecting INR.
              </p>
            </div>
          </div>
        </section>

        {/* High VK Table */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            High Vitamin K Foods
            <span className="ml-2 text-sm font-normal text-red-600">(&gt;100 mcg per 100g)</span>
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Showing top {data.highVk.length} of {data.highVk.length} foods. Values are per 100g and per common portion (ceil rounded for safety).
          </p>
          <div className="bg-white border rounded-lg overflow-hidden">
            <FoodTable foods={data.highVk} />
          </div>
        </section>

        {/* Moderate VK Table */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            Moderate Vitamin K Foods
            <span className="ml-2 text-sm font-normal text-yellow-600">(20–100 mcg per 100g)</span>
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Showing {data.moderateVk.length} of {data.moderateVk.length} foods.
          </p>
          <div className="bg-white border rounded-lg overflow-hidden">
            <FoodTable foods={data.moderateVk} />
          </div>
        </section>

        {/* Low VK Table */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            Low Vitamin K Foods
            <span className="ml-2 text-sm font-normal text-green-600">(&lt;20 mcg per 100g)</span>
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Showing {data.lowVk.length} sample foods. {data.zeroVkCount.toLocaleString()} more foods have 0 mcg vitamin K.
          </p>
          <div className="bg-white border rounded-lg overflow-hidden">
            <FoodTable foods={data.lowVk} />
          </div>
        </section>

        {/* Tips */}
        <section className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Tips for Managing Vitamin K on Warfarin</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li><strong>Be Consistent:</strong> Eat similar amounts of vitamin K daily rather than avoiding it completely.</li>
            <li><strong>Track Your Intake:</strong> Use <Link href="/auth/sign-up" className="text-blue-600 hover:underline">VitaK Tracker</Link> to monitor your daily vitamin K consumption.</li>
            <li><strong>Read Labels:</strong> Check nutrition labels, especially on green juices and meal replacements.</li>
            <li><strong>Cook Consistently:</strong> Cooking methods don&apos;t significantly change vitamin K content.</li>
            <li><strong>Communicate:</strong> Tell your doctor about any major dietary changes.</li>
          </ol>
        </section>

        {/* CTA */}
        <div className="text-center bg-gray-900 text-white rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-2">Start Tracking Your Vitamin K Today</h2>
          <p className="text-gray-300 mb-4">
            VitaK Tracker makes it easy to monitor your vitamin K intake with our database of {data.totalFoods.toLocaleString()} foods.
          </p>
          <Link
            href="/auth/sign-up"
            className="inline-block bg-white text-gray-900 font-semibold px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Create Free Account
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}