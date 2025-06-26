import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Footer } from "@/components/ui/footer";
import { Activity, Apple, Shield, TrendingUp } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">VitaK Tracker</h1>
          <div className="flex gap-4">
            <Link href="/auth/sign-in">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button>Get Started</Button>
            </Link>
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
            through our innovative credit-based tracking system.
          </p>
          <Link href="/auth/sign-up">
            <Button size="lg" className="text-lg px-8">
              Start Tracking Today
            </Button>
          </Link>
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

        <section className="bg-gray-100 rounded-lg p-8 text-center">
          <h3 className="text-3xl font-bold mb-4">
            Designed for Warfarin Patients
          </h3>
          <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
            Built with input from healthcare professionals and patients, VitaK
            Tracker makes managing your Vitamin K intake simple and stress-free.
          </p>
          <Link href="/auth/sign-up">
            <Button size="lg" variant="secondary">
              Create Your Account
            </Button>
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
}