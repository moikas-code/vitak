import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Footer } from "@/components/ui/footer";
import { PublicHeader } from "@/components/ui/public-header";
import { AlertCircle, Apple, Carrot, Leaf, Search } from "lucide-react";
import { BreadcrumbLD } from "@/components/seo/json-ld";

export const dynamic = 'force-static';
export const revalidate = 86400; // Revalidate daily

export const metadata: Metadata = {
  title: "Vitamin K Foods List for Warfarin Patients - Complete Guide",
  description: "Comprehensive guide to vitamin K content in foods for warfarin (Coumadin) patients. Learn which foods to limit, moderate, and enjoy freely while maintaining stable INR levels.",
  keywords: ["vitamin k foods", "warfarin diet", "coumadin foods to avoid", "high vitamin k vegetables", "low vitamin k foods", "INR diet", "blood thinner diet"],
  openGraph: {
    title: "Vitamin K Foods List for Warfarin Patients",
    description: "Complete guide to managing vitamin K intake while on warfarin. Food lists, serving sizes, and tracking tips.",
    type: "article",
  },
};

export default function VitaminKFoodsPage() {
  return (
    <>
      <BreadcrumbLD items={[
        { name: "Home", url: "/" },
        { name: "Vitamin K Foods for Warfarin", url: "/vitamin-k-foods-warfarin" }
      ]} />
      
      <div className="min-h-screen bg-gray-50">
        <PublicHeader />

        <main className="container mx-auto px-4 py-8">
          <article className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-4">
              Vitamin K Foods Guide for Warfarin Patients
            </h1>
            
            <p className="text-xl text-gray-600 mb-8">
              Understanding vitamin K content in foods is crucial for maintaining stable INR levels 
              while taking warfarin (Coumadin). This comprehensive guide helps you make informed 
              dietary choices.
            </p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-900">Important Medical Disclaimer</p>
                  <p className="text-sm text-yellow-800">
                    This guide is for educational purposes only. Always consult your healthcare 
                    provider before making dietary changes while on anticoagulation therapy.
                  </p>
                </div>
              </div>
            </div>

            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-4">Understanding Vitamin K and Warfarin</h2>
              <p className="mb-4">
                Vitamin K plays a crucial role in blood clotting. Warfarin works by reducing 
                vitamin K&apos;s effectiveness, preventing dangerous blood clots. Consuming 
                consistent amounts of vitamin K helps maintain stable INR levels and ensures 
                your warfarin dose remains effective.
              </p>
              <p className="mb-4">
                The key is <strong>consistency</strong>, not avoidance. Most patients can safely 
                consume 70-120 mcg of vitamin K daily.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6">Foods by Vitamin K Content</h2>
              
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600">
                      <Leaf className="h-5 w-5" />
                      High Vitamin K Foods (&gt;100 mcg per serving)
                    </CardTitle>
                    <CardDescription>
                      Limit these foods or maintain very consistent intake
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Leafy Greens</h4>
                        <ul className="text-sm space-y-1 text-gray-600">
                          <li>• Kale (1 cup): 547 mcg</li>
                          <li>• Spinach, cooked (1 cup): 444 mcg</li>
                          <li>• Collard greens (1 cup): 418 mcg</li>
                          <li>• Swiss chard (1 cup): 298 mcg</li>
                          <li>• Turnip greens (1 cup): 265 mcg</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Other High Sources</h4>
                        <ul className="text-sm space-y-1 text-gray-600">
                          <li>• Brussels sprouts (1 cup): 156 mcg</li>
                          <li>• Broccoli (1 cup): 110 mcg</li>
                          <li>• Parsley (¼ cup): 246 mcg</li>
                          <li>• Green tea (1 cup): 100+ mcg</li>
                          <li>• Natto (3 oz): 850 mcg</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-yellow-600">
                      <Apple className="h-5 w-5" />
                      Moderate Vitamin K Foods (20-100 mcg per serving)
                    </CardTitle>
                    <CardDescription>
                      Enjoy in moderation with consistent intake
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Vegetables</h4>
                        <ul className="text-sm space-y-1 text-gray-600">
                          <li>• Asparagus (1 cup): 56 mcg</li>
                          <li>• Green beans (1 cup): 43 mcg</li>
                          <li>• Green peas (1 cup): 41 mcg</li>
                          <li>• Cabbage (1 cup): 82 mcg</li>
                          <li>• Lettuce, green leaf (1 cup): 46 mcg</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Other Foods</h4>
                        <ul className="text-sm space-y-1 text-gray-600">
                          <li>• Avocado (1 medium): 30 mcg</li>
                          <li>• Kiwi (1 medium): 28 mcg</li>
                          <li>• Blueberries (1 cup): 29 mcg</li>
                          <li>• Pine nuts (1 oz): 25 mcg</li>
                          <li>• Canola oil (1 tbsp): 25 mcg</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600">
                      <Carrot className="h-5 w-5" />
                      Low Vitamin K Foods (&lt;20 mcg per serving)
                    </CardTitle>
                    <CardDescription>
                      Generally safe to eat freely
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Fruits & Vegetables</h4>
                        <ul className="text-sm space-y-1 text-gray-600">
                          <li>• Tomatoes (1 cup): 7 mcg</li>
                          <li>• Carrots (1 cup): 10 mcg</li>
                          <li>• Bell peppers (1 cup): 5 mcg</li>
                          <li>• Apples (1 medium): 3 mcg</li>
                          <li>• Bananas (1 medium): 0.5 mcg</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Proteins & Grains</h4>
                        <ul className="text-sm space-y-1 text-gray-600">
                          <li>• Chicken breast (4 oz): 0.3 mcg</li>
                          <li>• Salmon (4 oz): 0.1 mcg</li>
                          <li>• Eggs (1 large): 0.1 mcg</li>
                          <li>• White rice (1 cup): 0 mcg</li>
                          <li>• Pasta (1 cup): 0.1 mcg</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-4">Tips for Managing Vitamin K Intake</h2>
              <div className="bg-blue-50 rounded-lg p-6">
                <ol className="space-y-3">
                  <li className="flex gap-2">
                    <span className="font-bold text-blue-600">1.</span>
                    <span><strong>Be Consistent:</strong> Eat similar amounts of vitamin K daily rather than avoiding it completely.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-blue-600">2.</span>
                    <span><strong>Track Your Intake:</strong> Use VitaK Tracker to monitor your daily vitamin K consumption.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-blue-600">3.</span>
                    <span><strong>Read Labels:</strong> Check nutrition labels, especially on green juices and meal replacements.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-blue-600">4.</span>
                    <span><strong>Cook Consistently:</strong> Cooking methods don&apos;t significantly change vitamin K content.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-blue-600">5.</span>
                    <span><strong>Communicate:</strong> Tell your doctor about any major dietary changes.</span>
                  </li>
                </ol>
              </div>
            </section>

            <section className="mb-12">
              <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Start Tracking Your Vitamin K Today
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">
                    VitaK Tracker makes it easy to monitor your vitamin K intake with our 
                    comprehensive food database and credit-based tracking system.
                  </p>
                  <div className="flex gap-4">
                    <Link href="/auth/sign-up">
                      <Button size="lg">Create Free Account</Button>
                    </Link>
                    <Link href="/">
                      <Button size="lg" variant="outline">Learn More</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </section>
          </article>
        </main>

        <Footer />
      </div>
    </>
  );
}