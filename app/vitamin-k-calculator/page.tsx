import { Metadata } from "next";
import { Footer } from "@/components/ui/footer";
import { PublicHeader } from "@/components/ui/public-header";
import { BreadcrumbLD } from "@/components/seo/json-ld";
import { VitaminKCalculatorClient } from "@/components/vitamin-k-calculator-client";
import { getDb } from "@/lib/db";
import { foods } from "@/lib/db/schema";
import { like, or } from "drizzle-orm";

export const dynamic = 'force-dynamic';
export const revalidate = 86400; // Revalidate daily

export const metadata: Metadata = {
  title: "Free Vitamin K Calculator - Calculate mcg for Warfarin Patients",
  description: "Calculate vitamin K content in your meals with our free calculator. Perfect for warfarin patients managing daily vitamin K intake. Add foods, adjust portions, see total mcg instantly.",
  keywords: ["vitamin k calculator", "warfarin vitamin k calculator", "coumadin food calculator", "calculate vitamin k mcg", "vitamin k counter", "warfarin diet calculator"],
  openGraph: {
    title: "Vitamin K Calculator for Warfarin Patients",
    description: "Free tool to calculate total vitamin K content in meals. Essential for warfarin management.",
    type: "website",
  },
};

export default async function VitaminKCalculatorPage() {
  // Use accurate values from database migrations
  const fallbackFoods = [
    { id: "1", name: "Spinach (cooked)", vitamin_k_mcg_per_100g: 494 },
    { id: "2", name: "Kale (cooked)", vitamin_k_mcg_per_100g: 550 },
    { id: "3", name: "Broccoli (cooked)", vitamin_k_mcg_per_100g: 141 },
    { id: "4", name: "Romaine lettuce", vitamin_k_mcg_per_100g: 103 },
    { id: "5", name: "Cabbage (raw)", vitamin_k_mcg_per_100g: 76 },
    { id: "6", name: "Chicken breast", vitamin_k_mcg_per_100g: 0.3 },
    { id: "7", name: "Salmon", vitamin_k_mcg_per_100g: 0.1 },
    { id: "8", name: "Eggs", vitamin_k_mcg_per_100g: 0.3 },
    { id: "9", name: "Milk (whole)", vitamin_k_mcg_per_100g: 0.2 },
    { id: "10", name: "White rice", vitamin_k_mcg_per_100g: 0 },
  ];

  const commonFoodNames = [
    'Spinach (cooked)',
    'Kale (cooked)',
    'Broccoli (cooked)',
    'Romaine lettuce',
    'Cabbage (raw)',
    'Chicken breast',
    'Salmon',
    'Eggs',
    'Milk (whole)',
    'White rice'
  ];

  let commonFoods = fallbackFoods;
  
  // Try to fetch from database
  try {
    const db = await getDb();
    const data = await db
      .select({ id: foods.id, name: foods.name, vitamin_k_mcg_per_100g: foods.vitaminKMcgPer100g })
      .from(foods)
      .where(or(...commonFoodNames.map((name) => like(foods.name, `%${name}%`))))
      .orderBy(foods.name)
      .all();
    
    if (data && data.length > 0) {
      commonFoods = data;
    }
  } catch (error) {
    console.error("Failed to fetch common foods:", error);
  }

  return (
    <>
      <BreadcrumbLD items={[
        { name: "Home", url: "/" },
        { name: "Vitamin K Calculator", url: "/vitamin-k-calculator" }
      ]} />
      
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
            "name": "How to Calculate Vitamin K Content in Your Meals",
            "description": "Use our vitamin K calculator to determine the total vitamin K content in your meals for warfarin management",
            "step": [
              {
                "@type": "HowToStep",
                "name": "Select foods",
                "text": "Choose foods from the common foods list or add custom foods"
              },
              {
                "@type": "HowToStep",
                "name": "Adjust portions",
                "text": "Enter the portion size in grams for each food item"
              },
              {
                "@type": "HowToStep",
                "name": "View total",
                "text": "The calculator automatically shows total vitamin K content"
              }
            ],
            "tool": {
              "@type": "HowToTool",
              "name": "VitaK Tracker Vitamin K Calculator"
            }
          })
        }}
      />
    </>
  );
}