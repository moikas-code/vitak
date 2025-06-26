import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Footer } from "@/components/ui/footer";
import { BreadcrumbLD, FAQLD } from "@/components/seo/json-ld";
import { ChevronRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Frequently Asked Questions - VitaK Tracker",
  description: "Common questions about tracking vitamin K intake while on warfarin, using VitaK Tracker, and managing your anticoagulation diet.",
  keywords: ["warfarin faq", "vitamin k questions", "blood thinner diet help", "vitak tracker support"],
  alternates: {
    canonical: "/faq",
  },
};

const faqCategories = [
  {
    category: "Getting Started",
    questions: [
      {
        question: "What is VitaK Tracker?",
        answer: "VitaK Tracker is a free web application designed to help patients on warfarin (Coumadin) manage their vitamin K intake. It uses a credit-based system to track daily, weekly, and monthly vitamin K consumption to help maintain stable INR levels."
      },
      {
        question: "How do I start using VitaK Tracker?",
        answer: "Simply create a free account, set your vitamin K limits (consult your healthcare provider for appropriate amounts), and start logging your meals. The app will track your vitamin K credits automatically."
      },
      {
        question: "Is VitaK Tracker really free?",
        answer: "Yes, VitaK Tracker is completely free to use. We offer optional donations to help support development and hosting costs, but all features are available at no charge."
      }
    ]
  },
  {
    category: "Using the Credit System",
    questions: [
      {
        question: "How does the vitamin K credit system work?",
        answer: "The credit system allows you to set daily, weekly, and monthly vitamin K limits in micrograms (mcg). As you log foods, the app deducts the vitamin K content from your available credits, helping you stay within your prescribed limits."
      },
      {
        question: "What vitamin K limits should I set?",
        answer: "Vitamin K limits vary by individual and should be determined by your healthcare provider. Common daily limits range from 75-150 mcg, but your specific needs depend on your warfarin dosage and INR stability."
      },
      {
        question: "Can I change my vitamin K limits?",
        answer: "Yes, you can adjust your limits at any time in the Settings section of your dashboard. Changes take effect immediately for future tracking."
      }
    ]
  },
  {
    category: "Food Database & Tracking",
    questions: [
      {
        question: "How accurate is the vitamin K food database?",
        answer: "Our food database is compiled from reliable nutritional sources and regularly updated. However, vitamin K content can vary based on preparation methods and sourcing. Always consult with your healthcare provider for specific dietary guidance."
      },
      {
        question: "What if I can't find a food in the database?",
        answer: "We're continually expanding our database. If you can't find a specific food, try searching for similar items or individual ingredients. You can also contact support to request additions."
      },
      {
        question: "How do portion sizes work?",
        answer: "Each food shows vitamin K content per 100g and per common portion (like '1 cup' or '1 medium'). You can enter any portion size in grams, and the app calculates the exact vitamin K content automatically."
      }
    ]
  },
  {
    category: "Technical & Privacy",
    questions: [
      {
        question: "Can I use VitaK Tracker offline?",
        answer: "Yes, VitaK Tracker is a Progressive Web App (PWA) that supports offline functionality. Once installed, you can access your data and log meals even without an internet connection."
      },
      {
        question: "Is my health data secure?",
        answer: "Absolutely. We use industry-standard encryption and security measures. Your data is stored securely, and we never share personal health information with third parties."
      },
      {
        question: "Can I export my tracking data?",
        answer: "Currently, you can view your history through the dashboard. We're working on adding export functionality for CSV and PDF reports in a future update."
      }
    ]
  },
  {
    category: "Medical & Dietary",
    questions: [
      {
        question: "Should I avoid all vitamin K foods?",
        answer: "No! The key is consistency, not avoidance. Vitamin K is an essential nutrient. Work with your healthcare provider to maintain a consistent intake that works with your warfarin dosage."
      },
      {
        question: "How often should I track my meals?",
        answer: "For best results, track all meals and snacks daily. Consistent tracking helps you understand your vitamin K patterns and maintain stable INR levels."
      },
      {
        question: "Can VitaK Tracker replace INR monitoring?",
        answer: "No. VitaK Tracker is a dietary tracking tool only. You must continue regular INR monitoring as prescribed by your healthcare provider."
      }
    ]
  }
];

export default function FAQPage() {
  return (
    <>
      <BreadcrumbLD items={[
        { name: "Home", url: "/" },
        { name: "FAQ", url: "/faq" }
      ]} />
      <FAQLD />
      
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b">
          <div className="container mx-auto px-4 py-6">
            <nav className="flex items-center justify-between">
              <Link href="/" className="text-2xl font-bold text-gray-900">
                VitaK Tracker
              </Link>
              <Link href="/auth/sign-up">
                <Button>Start Tracking</Button>
              </Link>
            </nav>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Everything you need to know about tracking vitamin K while on warfarin
            </p>

            <div className="space-y-8">
              {faqCategories.map((category, categoryIndex) => (
                <Card key={categoryIndex}>
                  <CardHeader>
                    <CardTitle className="text-2xl">{category.category}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {category.questions.map((item, index) => (
                      <div key={index} className="space-y-2">
                        <h3 className="font-semibold text-lg flex items-start gap-2">
                          <ChevronRight className="h-5 w-5 mt-0.5 text-primary flex-shrink-0" />
                          {item.question}
                        </h3>
                        <p className="text-gray-600 ml-7">
                          {item.answer}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="mt-8 bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle>Still have questions?</CardTitle>
                <CardDescription>
                  We&apos;re here to help you manage your vitamin K intake effectively
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  If you couldn&apos;t find the answer you&apos;re looking for, please don&apos;t hesitate to reach out:
                </p>
                <ul className="space-y-2 text-sm">
                  <li>• Email: support@vitaktracker.com</li>
                  <li>• Visit our <Link href="/blog" className="text-primary hover:underline">blog</Link> for detailed guides</li>
                  <li>• Check for updates on our <a href="https://twitter.com/moikas_official" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Twitter</a></li>
                </ul>
              </CardContent>
            </Card>

            <div className="mt-12 text-center">
              <p className="text-gray-600 mb-4">
                Ready to start tracking your vitamin K intake?
              </p>
              <Link href="/auth/sign-up">
                <Button size="lg">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}