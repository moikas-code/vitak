import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Footer } from "@/components/ui/footer";
import { MobileNav } from "@/components/ui/mobile-nav";
import { LandingHeroVisual } from "@/components/ui/landing-hero-visual";
import { Activity, Apple, Shield, Bell, Calculator, FileText, BookOpen, Smartphone, CheckCircle2, ArrowRight } from "lucide-react";
import { WebApplicationLD, MedicalWebPageLD, OrganizationLD, FAQLD } from "@/components/seo/json-ld";
import { auth } from "@clerk/nextjs/server";

export const revalidate = 3600;

export default async function HomePage() {
  const session = await auth();
  const isLoggedIn = !!session?.userId;

  return (
    <>
      <WebApplicationLD />
      <MedicalWebPageLD />
      <OrganizationLD />
      <FAQLD />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <header className="container mx-auto px-4 py-6">
          <nav className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">VitaK Tracker</h1>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex gap-3">
                {isLoggedIn ? (
                  <Link href="/dashboard">
                    <Button>Dashboard</Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/auth/sign-in">
                      <Button variant="ghost">Sign In</Button>
                    </Link>
                    <Link href="/auth/sign-up">
                      <Button>Get Started Free</Button>
                    </Link>
                  </>
                )}
              </div>
              <MobileNav isAuthenticated={isLoggedIn} />
            </div>
          </nav>
        </header>

        <main className="container mx-auto px-4">
          {/* ── Hero ─────────────────────────────────────────────── */}
          <section className="py-16 md:py-24">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-green-50 border border-green-200 px-3 py-1 text-sm text-green-700 mb-6">
                  <CheckCircle2 className="h-4 w-4" />
                  USDA-verified nutritional data
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                  Stay on track.
                  <br />
                  <span className="text-green-600">Stay safe.</span>
                </h2>
                <p className="text-lg text-gray-600 mb-8 max-w-lg">
                  Warfarin requires consistent Vitamin K intake — not too much, not too little.
                  VitaK Tracker makes it simple with a credit system, visual charts, and alerts
                  so you can focus on living, not counting micrograms.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  {isLoggedIn ? (
                    <Link href="/dashboard">
                      <Button size="lg" className="text-lg px-8">
                        Go to Dashboard
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Link href="/auth/sign-up">
                        <Button size="lg" className="text-lg px-8">
                          Start Tracking Free
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                      </Link>
                      <Link href="/vitamin-k-calculator">
                        <Button size="lg" variant="outline" className="text-lg px-8">
                          Try Calculator
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
              <div className="hidden md:block">
                <LandingHeroVisual />
              </div>
            </div>
          </section>

          {/* ── How It Works ─────────────────────────────────────── */}
          <section className="py-16 border-t">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold mb-3">How It Works</h3>
              <p className="text-gray-600 max-w-xl mx-auto">
                Three steps to consistent Vitamin K intake and stable INR levels.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  1
                </div>
                <h4 className="font-semibold text-lg mb-2">Log Your Meals</h4>
                <p className="text-gray-600 text-sm">
                  Search our USDA-backed food database and log what you ate. Portion sizes are calculated automatically.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  2
                </div>
                <h4 className="font-semibold text-lg mb-2">Watch Your Credits</h4>
                <p className="text-gray-600 text-sm">
                  Daily, weekly, and monthly Vitamin K credits update in real time. Color-coded indicators tell you at a glance.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  3
                </div>
                <h4 className="font-semibold text-lg mb-2">Stay Within Limits</h4>
                <p className="text-gray-600 text-sm">
                  Alerts when you approach your limit. Charts showing trends. Consistency that keeps your INR stable.
                </p>
              </div>
            </div>
          </section>

          {/* ── Feature Cards ────────────────────────────────────── */}
          <section className="py-16 border-t">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold mb-3">Built for Consistency</h3>
              <p className="text-gray-600 max-w-xl mx-auto">
                Every feature designed around one goal: stable Vitamin K intake for stable INR.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-t-4 border-t-green-500">
                <CardHeader>
                  <Activity className="h-8 w-8 text-green-600 mb-2" />
                  <CardTitle className="text-base">Credit System</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Daily, weekly, and monthly Vitamin K budgets — not just a running total.
                    Know exactly where you stand.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="border-t-4 border-t-amber-500">
                <CardHeader>
                  <Bell className="h-8 w-8 text-amber-600 mb-2" />
                  <CardTitle className="text-base">Smart Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Color-coded warnings when you approach or exceed limits. Never guess if you&apos;re in range.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="border-t-4 border-t-blue-500">
                <CardHeader>
                  <Apple className="h-8 w-8 text-blue-600 mb-2" />
                  <CardTitle className="text-base">USDA Database</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Research-accurate Vitamin K values for hundreds of foods. Search, browse, and log in seconds.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="border-t-4 border-t-red-500">
                <CardHeader>
                  <Shield className="h-8 w-8 text-red-600 mb-2" />
                  <CardTitle className="text-base">INR Safety</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Consistent intake = stable INR. Track trends over days, weeks, and months to stay in range.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* ── Free Tools ────────────────────────────────────────── */}
          <section className="py-16 border-t">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold mb-3">Free Tools & Resources</h3>
              <p className="text-gray-600 max-w-xl mx-auto">
                No account required. Use these tools right now.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardHeader>
                  <Calculator className="h-8 w-8 text-blue-600 mb-2" />
                  <CardTitle className="text-blue-900">Vitamin K Calculator</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4 text-blue-700">
                    Calculate total Vitamin K in your meals. Perfect for planning before you eat.
                  </CardDescription>
                  <Link href="/vitamin-k-calculator">
                    <Button variant="outline" className="w-full border-blue-300 text-blue-700 hover:bg-blue-50">
                      Try Calculator →
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardHeader>
                  <FileText className="h-8 w-8 text-green-600 mb-2" />
                  <CardTitle className="text-green-900">Printable Food Chart</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4 text-green-700">
                    Download and print a comprehensive Vitamin K food chart for grocery shopping.
                  </CardDescription>
                  <Link href="/warfarin-food-chart">
                    <Button variant="outline" className="w-full border-green-300 text-green-700 hover:bg-green-50">
                      Get Chart →
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
                <CardHeader>
                  <BookOpen className="h-8 w-8 text-amber-600 mb-2" />
                  <CardTitle className="text-amber-900">Vitamin K Foods Guide</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4 text-amber-700">
                    Which foods to limit, moderate, and enjoy freely while on warfarin.
                  </CardDescription>
                  <Link href="/vitamin-k-foods-warfarin">
                    <Button variant="outline" className="w-full border-amber-300 text-amber-700 hover:bg-amber-50">
                      View Guide →
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardHeader>
                  <Smartphone className="h-8 w-8 text-purple-600 mb-2" />
                  <CardTitle className="text-purple-900">Diet Tracker Guide</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4 text-purple-700">
                    Learn how the credit system, food database, and tracking features work together.
                  </CardDescription>
                  <Link href="/warfarin-diet-tracker">
                    <Button variant="outline" className="w-full border-purple-300 text-purple-700 hover:bg-purple-50">
                      Learn More →
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* ── PWA Install ────────────────────────────────────────── */}
          <section className="py-16 border-t">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8 md:p-12 text-center">
              <Smartphone className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-4">
                Take It Everywhere
              </h3>
              <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
                Install as a PWA on your phone for offline access, instant loading, 
                and home screen convenience. No app store needed.
              </p>
              <Link href="/install">
                <Button size="lg" className="text-lg px-8">
                  Install App
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </section>

          {/* ── Bottom CTA ────────────────────────────────────────── */}
          <section className="py-16 border-t">
            <div className="text-center max-w-2xl mx-auto">
              <h3 className="text-3xl font-bold mb-4">
                Consistent Vitamin K. Stable INR. Less worry.
              </h3>
              <p className="text-lg text-gray-600 mb-8">
                Built on USDA data and designed for the real-world needs of warfarin patients.
                Always consult your healthcare provider for personalized dietary guidance.
              </p>
              {isLoggedIn ? (
                <Link href="/dashboard">
                  <Button size="lg" className="text-lg px-8">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <Link href="/auth/sign-up">
                  <Button size="lg" className="text-lg px-8">
                    Create Free Account
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              )}
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}