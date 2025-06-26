import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Footer } from "@/components/ui/footer";
import { PrintButton } from "@/components/ui/print-button";
import { AlertCircle } from "lucide-react";
import { BreadcrumbLD } from "@/components/seo/json-ld";
import { createClient } from "@supabase/supabase-js";

export const metadata: Metadata = {
  title: "Warfarin Food Chart - Printable Vitamin K Food List",
  description: "Free printable warfarin food chart showing vitamin K content in common foods. Download or print this comprehensive guide for easy reference while grocery shopping or meal planning.",
  keywords: ["warfarin food chart", "vitamin k food list pdf", "printable warfarin diet", "coumadin food chart", "blood thinner food list"],
  alternates: {
    canonical: "/warfarin-food-chart",
  },
  openGraph: {
    title: "Printable Warfarin Food Chart - Vitamin K Content Guide",
    description: "Download or print our comprehensive vitamin K food chart for warfarin patients",
    type: "article",
  },
};

interface FoodChartItem {
  name: string;
  vitaminK: string;
}

interface FoodCategory {
  category: string;
  color: string;
  foods: FoodChartItem[];
}

function calculate_vitamin_k_per_serving(vitamin_k_per_100g: number, portion_size_g: number): number {
  return Math.round((vitamin_k_per_100g * portion_size_g) / 100);
}

function format_food_name(name: string, portion_name: string): string {
  return `${name} (${portion_name})`;
}

async function get_food_categories(): Promise<FoodCategory[]> {
  try {
    // Use direct Supabase client for static generation
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const { data: foods, error } = await supabase
      .from("foods")
      .select("name, vitamin_k_mcg_per_100g, common_portion_size_g, common_portion_name")
      .order("vitamin_k_mcg_per_100g", { ascending: false });

    if (error || !foods) {
      console.error("Failed to fetch foods:", error);
      return get_fallback_categories();
    }

    // Calculate vitamin K per serving for each food
    const foods_with_serving_values = foods.map(food => ({
      name: food.name,
      vitamin_k_per_serving: calculate_vitamin_k_per_serving(
        food.vitamin_k_mcg_per_100g,
        food.common_portion_size_g
      ),
      formatted_name: format_food_name(food.name, food.common_portion_name)
    }));

    // Categorize foods by vitamin K per serving
    const very_high_foods = foods_with_serving_values
      .filter(food => food.vitamin_k_per_serving > 100)
      .slice(0, 12) // Limit to top foods
      .map(food => ({
        name: food.formatted_name,
        vitaminK: `${food.vitamin_k_per_serving} mcg`
      }));

    const high_foods = foods_with_serving_values
      .filter(food => food.vitamin_k_per_serving >= 20 && food.vitamin_k_per_serving <= 100)
      .slice(0, 12)
      .map(food => ({
        name: food.formatted_name,
        vitaminK: `${food.vitamin_k_per_serving} mcg`
      }));

    const moderate_foods = foods_with_serving_values
      .filter(food => food.vitamin_k_per_serving >= 5 && food.vitamin_k_per_serving < 20)
      .slice(0, 12)
      .map(food => ({
        name: food.formatted_name,
        vitaminK: `${food.vitamin_k_per_serving} mcg`
      }));

    const low_foods = foods_with_serving_values
      .filter(food => food.vitamin_k_per_serving < 5)
      .slice(0, 15)
      .map(food => ({
        name: food.formatted_name,
        vitaminK: `${food.vitamin_k_per_serving} mcg`
      }));

    return [
      {
        category: "Very High Vitamin K (>100 mcg per serving)",
        color: "bg-red-50 border-red-200",
        foods: very_high_foods
      },
      {
        category: "High Vitamin K (20-100 mcg per serving)",
        color: "bg-orange-50 border-orange-200",
        foods: high_foods
      },
      {
        category: "Moderate Vitamin K (5-20 mcg per serving)",
        color: "bg-yellow-50 border-yellow-200",
        foods: moderate_foods
      },
      {
        category: "Low Vitamin K (<5 mcg per serving)",
        color: "bg-green-50 border-green-200",
        foods: low_foods
      }
    ];
  } catch (error) {
    console.error("Error fetching food categories:", error);
    return get_fallback_categories();
  }
}

function get_fallback_categories(): FoodCategory[] {
  return [
    {
      category: "Very High Vitamin K (>100 mcg per serving)",
      color: "bg-red-50 border-red-200",
      foods: [
        { name: "Kale (cooked, 1 cup)", vitaminK: "794 mcg" },
        { name: "Spinach (cooked, 1 cup)", vitaminK: "889 mcg" },
        { name: "Collard greens (cooked, 1 cup)", vitaminK: "803 mcg" },
        { name: "Swiss chard (cooked, 1 cup)", vitaminK: "792 mcg" },
        { name: "Mustard greens (cooked, 1 cup)", vitaminK: "603 mcg" },
        { name: "Broccoli (cooked, 1 cup)", vitaminK: "220 mcg" },
        { name: "Parsley (fresh, 1 tbsp)", vitaminK: "66 mcg" },
        { name: "Beet greens (cooked, 1 cup)", vitaminK: "697 mcg" }
      ]
    },
    {
      category: "High Vitamin K (20-100 mcg per serving)",
      color: "bg-orange-50 border-orange-200",
      foods: [
        { name: "Romaine lettuce (1 cup)", vitaminK: "48 mcg" },
        { name: "Green beans (cooked, 1 cup)", vitaminK: "54 mcg" },
        { name: "Cabbage (cooked, 1 cup)", vitaminK: "245 mcg" },
        { name: "Peas (green, cooked, 1 cup)", vitaminK: "38 mcg" },
        { name: "Blueberries (1 cup)", vitaminK: "28 mcg" },
        { name: "Kiwifruit (1 medium)", vitaminK: "28 mcg" }
      ]
    },
    {
      category: "Moderate Vitamin K (5-20 mcg per serving)",
      color: "bg-yellow-50 border-yellow-200",
      foods: [
        { name: "Cucumber with peel (1 cup)", vitaminK: "17 mcg" },
        { name: "Celery (raw, 1 cup)", vitaminK: "29 mcg" },
        { name: "Avocado (1 medium)", vitaminK: "32 mcg" },
        { name: "Pistachios (1 oz)", vitaminK: "4 mcg" },
        { name: "Pine nuts (1 oz)", vitaminK: "15 mcg" }
      ]
    },
    {
      category: "Low Vitamin K (<5 mcg per serving)",
      color: "bg-green-50 border-green-200",
      foods: [
        { name: "Chicken breast (3 oz)", vitaminK: "0 mcg" },
        { name: "Salmon (3 oz)", vitaminK: "0 mcg" },
        { name: "Eggs (1 large)", vitaminK: "0 mcg" },
        { name: "White rice (1 cup)", vitaminK: "0 mcg" },
        { name: "Milk (whole, 1 cup)", vitaminK: "0 mcg" },
        { name: "Apple (1 medium)", vitaminK: "3 mcg" },
        { name: "Banana (1 medium)", vitaminK: "1 mcg" },
        { name: "Orange (1 medium)", vitaminK: "0 mcg" }
      ]
    }
  ];
}

export default async function WarfarinFoodChartPage() {
  const food_categories = await get_food_categories();
  return (
    <>
      <BreadcrumbLD items={[
        { name: "Home", url: "/" },
        { name: "Warfarin Food Chart", url: "/warfarin-food-chart" }
      ]} />
      
      <div className="min-h-screen bg-gray-50 print:bg-white">
        <header className="bg-white border-b print:hidden">
          <div className="container mx-auto px-4 py-6">
            <nav className="flex items-center justify-between">
              <Link href="/" className="text-2xl font-bold text-gray-900">
                VitaK Tracker
              </Link>
              <div className="flex gap-2">
                <Link href="/auth/sign-up">
                  <Button>Start Tracking</Button>
                </Link>
              </div>
            </nav>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 print:py-4">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8 print:mb-4">
              <h1 className="text-4xl font-bold mb-4 print:text-2xl">
                Warfarin Food Chart
              </h1>
              <p className="text-xl text-gray-600 print:text-base">
                Printable vitamin K content guide for common foods
              </p>
              <div className="mt-4 flex gap-2 print:hidden">
                <PrintButton>
                  Print This Chart
                </PrintButton>
              </div>
            </div>

            <Card className="mb-6 print:shadow-none print:border-2">
              <CardHeader className="print:pb-2">
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  Important Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm print:text-xs">
                  This chart is for general reference only. Vitamin K content can vary based on 
                  preparation methods and serving sizes. Always consult with your healthcare 
                  provider about your specific dietary requirements while taking warfarin.
                </p>
              </CardContent>
            </Card>

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
                          <span className="font-medium">{food.name}</span>
                          <span className="text-gray-600 print:font-semibold">{food.vitaminK}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

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

            <div className="mt-8 text-center print:hidden">
              <p className="text-gray-600 mb-4">
                Want to automatically track your vitamin K intake?
              </p>
              <Link href="/auth/sign-up">
                <Button size="lg">
                  Sign Up for Free Tracking
                </Button>
              </Link>
            </div>

            <div className="mt-4 text-center text-sm text-gray-500 print:block hidden">
              <p>Chart provided by VitaK Tracker - vitaktracker.com</p>
              <p>Date printed: {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </main>

        <Footer />
      </div>


      {/* Schema for the chart */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": "Warfarin Food Chart - Vitamin K Content Guide",
            "description": "Comprehensive printable chart showing vitamin K content in common foods for warfarin patients",
            "author": {
              "@type": "Organization",
              "name": "VitaK Tracker"
            },
            "publisher": {
              "@type": "Organization",
              "name": "VitaK Tracker",
              "logo": {
                "@type": "ImageObject",
                "url": `${process.env.NEXT_PUBLIC_APP_URL}/icon-512x512.svg`
              }
            },
            "datePublished": new Date().toISOString(),
            "dateModified": new Date().toISOString()
          })
        }}
      />
    </>
  );
}