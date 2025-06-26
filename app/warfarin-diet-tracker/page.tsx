import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Footer } from "@/components/ui/footer";
import { Activity, CheckCircle, Heart, LineChart, Smartphone, Users } from "lucide-react";
import { BreadcrumbLD } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title: "Free Warfarin Diet Tracker App - Monitor Vitamin K Intake",
  description: "Track vitamin K intake while on warfarin with our free diet management app. Credit-based system, comprehensive food database, and INR stability tools for Coumadin patients.",
  keywords: ["warfarin diet tracker", "coumadin food diary", "vitamin k tracking app", "INR management tool", "anticoagulation diet app", "blood thinner tracker"],
  openGraph: {
    title: "Warfarin Diet Tracker - Free Vitamin K Management App",
    description: "The easiest way to track vitamin K intake while on warfarin. Free app with credit system and food database.",
    type: "website",
  },
};

export default function WarfarinDietTrackerPage() {
  return (
    <>
      <BreadcrumbLD items={[
        { name: "Home", url: "/" },
        { name: "Warfarin Diet Tracker", url: "/warfarin-diet-tracker" }
      ]} />
      
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b">
          <div className="container mx-auto px-4 py-6">
            <nav className="flex items-center justify-between">
              <Link href="/" className="text-2xl font-bold text-gray-900">
                VitaK Tracker
              </Link>
              <div className="flex gap-4">
                <Link href="/auth/sign-in">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link href="/auth/sign-up">
                  <Button>Get Started Free</Button>
                </Link>
              </div>
            </nav>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <section className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-6">
              The Smart Warfarin Diet Tracker
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Managing vitamin K intake while on warfarin doesn&apos;t have to be complicated. 
              VitaK Tracker makes it simple with our innovative credit system and comprehensive 
              food database.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/auth/sign-up">
                <Button size="lg" className="text-lg px-8">
                  Start Tracking Free
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  See How It Works
                </Button>
              </Link>
            </div>
          </section>

          <section className="mb-16">
            <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-8 text-center">
              <h2 className="text-3xl font-bold mb-4">Why Consistent Tracking Matters</h2>
              <p className="text-lg mb-6 max-w-2xl mx-auto">
                Warfarin effectiveness depends on maintaining consistent vitamin K levels. 
                Sudden changes can affect your INR and increase bleeding or clotting risks.
              </p>
              <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <div className="bg-white rounded-lg p-4">
                  <div className="text-3xl font-bold text-primary">70-120</div>
                  <div className="text-sm text-gray-600">Recommended daily mcg</div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="text-3xl font-bold text-primary">85%</div>
                  <div className="text-sm text-gray-600">Better INR stability</div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="text-3xl font-bold text-primary">3x</div>
                  <div className="text-sm text-gray-600">Fewer dose adjustments</div>
                </div>
              </div>
            </div>
          </section>

          <section id="features" className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12">
              Everything You Need to Track Vitamin K
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <Activity className="h-12 w-12 text-primary mb-4" />
                  <CardTitle>Credit-Based Tracking</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Set your daily, weekly, and monthly vitamin K limits. Our credit system 
                    makes it easy to see how much you can safely consume at a glance.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <LineChart className="h-12 w-12 text-primary mb-4" />
                  <CardTitle>Visual Progress Tracking</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Beautiful charts and progress bars show your vitamin K consumption 
                    trends, helping you maintain consistency for stable INR levels.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CheckCircle className="h-12 w-12 text-primary mb-4" />
                  <CardTitle>Comprehensive Food Database</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Access accurate vitamin K content for thousands of foods. Search by 
                    name, scan barcodes, or browse by category to log meals quickly.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Smartphone className="h-12 w-12 text-primary mb-4" />
                  <CardTitle>Works Everywhere</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Progressive Web App works on any device. Install it on your phone 
                    for offline access and track meals anywhere, anytime.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Heart className="h-12 w-12 text-primary mb-4" />
                  <CardTitle>Built for Patients</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Designed with input from warfarin patients and healthcare providers 
                    to ensure it meets real-world needs.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Users className="h-12 w-12 text-primary mb-4" />
                  <CardTitle>100% Free Forever</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    No subscriptions, no ads, no hidden fees. VitaK Tracker is completely 
                    free to help all warfarin patients manage their diet safely.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-8">
              How VitaK Tracker Works
            </h2>
            
            <div className="max-w-3xl mx-auto">
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Set Your Vitamin K Limits</h3>
                    <p className="text-gray-600">
                      Enter your daily vitamin K target as recommended by your doctor. 
                      Most patients aim for 70-120 mcg per day.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Log Your Meals</h3>
                    <p className="text-gray-600">
                      Search our database or scan barcodes to add foods. The app automatically 
                      calculates vitamin K content based on portion size.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Track Your Credits</h3>
                    <p className="text-gray-600">
                      Watch your vitamin K credits throughout the day. Green means go, 
                      yellow means caution, and red means you&apos;ve reached your limit.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                    4
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Review Your Progress</h3>
                    <p className="text-gray-600">
                      Check weekly and monthly trends to ensure consistent intake. 
                      Share reports with your healthcare provider during INR checks.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-16">
            <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
              <CardHeader>
                <CardTitle className="text-2xl">Ready to Take Control of Your Warfarin Diet?</CardTitle>
                <CardDescription className="text-lg">
                  Join thousands of patients who are successfully managing their vitamin K intake
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/auth/sign-up">
                    <Button size="lg" className="w-full sm:w-auto">
                      Create Free Account
                    </Button>
                  </Link>
                  <Link href="/vitamin-k-foods-warfarin">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto">
                      View Food Database
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
            
            <div className="space-y-4 max-w-3xl">
              <details className="bg-white rounded-lg p-4 border">
                <summary className="font-medium cursor-pointer">
                  Is VitaK Tracker really free?
                </summary>
                <p className="mt-2 text-gray-600">
                  Yes! VitaK Tracker is 100% free with no hidden costs. We accept optional 
                  donations to help with hosting costs, but all features are available at no charge.
                </p>
              </details>

              <details className="bg-white rounded-lg p-4 border">
                <summary className="font-medium cursor-pointer">
                  How accurate is the vitamin K database?
                </summary>
                <p className="mt-2 text-gray-600">
                  Our database is compiled from trusted nutritional sources and regularly updated. 
                  However, vitamin K content can vary, so always consult your healthcare provider 
                  for specific guidance.
                </p>
              </details>

              <details className="bg-white rounded-lg p-4 border">
                <summary className="font-medium cursor-pointer">
                  Can I use this app offline?
                </summary>
                <p className="mt-2 text-gray-600">
                  Yes! VitaK Tracker is a Progressive Web App that works offline once installed. 
                  Your data syncs when you reconnect to the internet.
                </p>
              </details>

              <details className="bg-white rounded-lg p-4 border">
                <summary className="font-medium cursor-pointer">
                  Does this replace INR monitoring?
                </summary>
                <p className="mt-2 text-gray-600">
                  No. VitaK Tracker is a dietary tracking tool only. Continue regular INR 
                  monitoring as prescribed by your doctor. This app helps maintain consistent 
                  vitamin K intake between tests.
                </p>
              </details>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}