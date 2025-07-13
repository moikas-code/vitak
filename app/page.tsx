import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Footer } from "@/components/ui/footer";
import { MobileNav } from "@/components/ui/mobile-nav";
import { Activity, Apple, Shield, TrendingUp, Download, Calculator, FileText } from "lucide-react";
import { WebApplicationLD, MedicalWebPageLD, OrganizationLD, FAQLD } from "@/components/seo/json-ld";
import { auth } from "@clerk/nextjs/server";

export const revalidate = 3600; // Revalidate every hour

export default async function HomePage() {
  const session = await auth();
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
            <div className="hidden md:block gap-4">
              {session?.userId ? (
                <Link href="/dashboard">
                  <Button>Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link href="/auth/sign-in" className={'md:mr-2'}>
                    <Button>Login</Button>
                  </Link>
                  <Link href="/auth/sign-up">
                    <Button>Get Started</Button>
                  </Link>
                </>
              )}
            </div>
            <MobileNav isAuthenticated={!!session?.userId} />
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-16">
        <section className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Manage Vitamin K with Confidence
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            VitaK Tracker helps warfarin patients maintain consistent Vitamin K intake
            through our research-based credit system and comprehensive USDA nutritional database.
          </p>
          {session?.userId ? (
            <Link href="/dashboard">
              <Button size="lg" className="text-lg px-8">
                Go to Dashboard
              </Button>
            </Link>
          ) : (
            <Link href="/auth/sign-up">
              <Button size="lg" className="text-lg px-8">
                Start Tracking Today
              </Button>
            </Link>
          )}
        </section>

        <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card>
            <CardHeader>
              <Activity className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Credit System</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Track your Vitamin K intake with easy-to-understand daily,
                weekly, and monthly credits.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Apple className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Food Database</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Access a comprehensive database of foods with accurate Vitamin K
                content information.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <TrendingUp className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Visual Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                See your progress at a glance with intuitive charts and
                visual indicators.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Stay Safe</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Get alerts when approaching your Vitamin K limits to maintain
                stable INR levels.
              </CardDescription>
            </CardContent>
          </Card>
        </section>

        <section className="mb-16">
          <h3 className="text-3xl font-bold text-center mb-8">
            Free Tools & Resources
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardHeader>
                <Calculator className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle className="text-blue-900">Vitamin K Calculator</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4 text-blue-700">
                  Calculate total vitamin K content in your meals. Perfect for planning 
                  meals and staying within your daily limits.
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
                  Download and print our comprehensive vitamin K food chart. Perfect 
                  for grocery shopping and meal planning.
                </CardDescription>
                <Link href="/warfarin-food-chart">
                  <Button variant="outline" className="w-full border-green-300 text-green-700 hover:bg-green-50">
                    Get Chart →
                  </Button>
                </Link>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Vitamin K Foods Guide</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  Comprehensive list of foods and their vitamin K content. Learn which foods 
                  to limit, moderate, and enjoy freely while on warfarin.
                </CardDescription>
                <Link href="/vitamin-k-foods-warfarin">
                  <Button variant="outline" className="w-full">
                    View Food Guide →
                  </Button>
                </Link>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Diet Tracker Guide</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  Learn how VitaK Tracker helps you manage your warfarin diet with our 
                  credit system, food database, and tracking features.
                </CardDescription>
                <Link href="/warfarin-diet-tracker">
                  <Button variant="outline" className="w-full">
                    Learn More →
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mb-16 text-center bg-primary/5 rounded-lg p-8">
          <Download className="h-12 w-12 text-primary mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-4">
            Take VitaK Tracker Anywhere
          </h3>
          <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
            Install our app on your phone or computer for offline access, 
            faster loading, and convenient home screen access.
          </p>
          <Link href="/install">
            <Button size="lg" variant="outline">
              <Download className="mr-2 h-5 w-5" />
              Install App
            </Button>
          </Link>
        </section>

        <section className="bg-gray-100 rounded-lg p-8 text-center">
          <h3 className="text-3xl font-bold mb-4">
            Designed for Warfarin Patients
          </h3>
          <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
            Built through comprehensive research and powered by USDA nutritional data, VitaK
            Tracker makes managing your Vitamin K intake simple and stress-free. Always consult
            your healthcare provider for personalized dietary guidance.
          </p>
          {session?.userId ? (
            <Link href="/dashboard">
              <Button size="lg" variant="secondary">
                Go to Dashboard
              </Button>
            </Link>
          ) : (
            <Link href="/auth/sign-up">
              <Button size="lg" variant="secondary">
                Create Your Account
              </Button>
            </Link>
          )}
        </section>
      </main>

        <Footer />
      </div>
    </>
  );
}