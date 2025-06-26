import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Footer } from "@/components/ui/footer";
import { AlertCircle, Activity, Clock, Heart, Stethoscope, AlertTriangle } from "lucide-react";
import { BreadcrumbLD, MedicalWebPageLD } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title: "INR Management Guide for Warfarin Patients - Monitoring & Tips",
  description: "Comprehensive guide to managing INR levels while on warfarin. Learn about target ranges, monitoring frequency, vitamin K reversal, and maintaining stable INR.",
  keywords: ["INR management", "warfarin monitoring", "INR target range", "vitamin K reversal", "elevated INR", "INR testing", "warfarin dosing", "anticoagulation management"],
  openGraph: {
    title: "INR Management Guide for Warfarin Patients",
    description: "Expert guidance on managing INR levels, monitoring schedules, and handling elevated readings while on warfarin therapy.",
    type: "article",
  },
};

export default function INRManagementPage() {
  return (
    <>
      <BreadcrumbLD items={[
        { name: "Home", url: "/" },
        { name: "INR Management Tips", url: "/inr-vitamin-k-management" }
      ]} />
      <MedicalWebPageLD />
      
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
          <article className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-4">
              INR Management Guide for Warfarin Patients
            </h1>
            
            <p className="text-xl text-gray-600 mb-8">
              Effective INR management is crucial for safe warfarin therapy. This guide provides 
              evidence-based strategies for monitoring, maintaining stability, and handling elevated INR levels.
            </p>

            <div className="bg-amber-50 border-l-4 border-amber-400 p-6 mb-8">
              <div className="flex">
                <AlertCircle className="h-6 w-6 text-amber-600 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-amber-800 mb-2">Medical Disclaimer</h3>
                  <p className="text-amber-700">
                    This guide is for educational purposes only. Always consult your healthcare provider 
                    for personalized medical advice. Never adjust your warfarin dose without medical supervision.
                  </p>
                </div>
              </div>
            </div>

            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-6 flex items-center">
                <Stethoscope className="h-8 w-8 mr-3 text-primary" />
                Understanding INR and Target Ranges
              </h2>
              
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>What is INR?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">
                    INR (International Normalized Ratio) measures how long it takes your blood to clot 
                    compared to normal. Higher INR means slower clotting and increased bleeding risk.
                  </p>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Common Target Ranges:</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <span className="font-medium mr-2">2.0-3.0:</span>
                        <span>Most conditions (atrial fibrillation, DVT, PE)</span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-medium mr-2">2.5-3.5:</span>
                        <span>Mechanical heart valves (some types)</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-6 flex items-center">
                <Clock className="h-8 w-8 mr-3 text-primary" />
                Monitoring Guidelines
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Stable INR</CardTitle>
                    <CardDescription>When INR is consistently in range</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      <li>• Test every 4-6 weeks</li>
                      <li>• Maximum interval: 12 weeks</li>
                      <li>• Continue current warfarin dose</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Unstable INR</CardTitle>
                    <CardDescription>When INR fluctuates or is out of range</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      <li>• Test weekly or more frequently</li>
                      <li>• After dose changes: retest in 3-7 days</li>
                      <li>• Track dietary changes</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-gray-100 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-3">Special Testing Situations</h3>
                <ul className="space-y-2">
                  <li>• <strong>Starting new medications:</strong> Test within 3-5 days</li>
                  <li>• <strong>After illness or surgery:</strong> More frequent monitoring needed</li>
                  <li>• <strong>INR &gt;5 or &lt;1.5:</strong> Retest within 7 days</li>
                  <li>• <strong>INR 3.1-3.9 or 1.6-1.9:</strong> Retest within 14 days</li>
                </ul>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-6 flex items-center">
                <AlertTriangle className="h-8 w-8 mr-3 text-primary" />
                Managing Elevated INR
              </h2>
              
              <div className="space-y-6">
                <Card className="border-yellow-200 bg-yellow-50">
                  <CardHeader>
                    <CardTitle className="text-yellow-800">INR 3.1-4.9 (No bleeding)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-yellow-700">
                      <li>• Skip or reduce next warfarin dose</li>
                      <li>• Resume at lower dose when INR therapeutic</li>
                      <li>• Recheck INR in 3-7 days</li>
                      <li>• Review recent diet and medication changes</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-orange-200 bg-orange-50">
                  <CardHeader>
                    <CardTitle className="text-orange-800">INR 5.0-9.0 (No bleeding)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-orange-700">
                      <li>• Hold warfarin for 1-2 doses</li>
                      <li>• Consider oral vitamin K (1-2.5 mg)</li>
                      <li>• Recheck INR within 24-48 hours</li>
                      <li>• Resume warfarin at reduced dose when INR &lt;3.0</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-red-200 bg-red-50">
                  <CardHeader>
                    <CardTitle className="text-red-800">INR &gt;9.0 (No bleeding)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-red-700">
                      <li>• Hold all warfarin doses</li>
                      <li>• Give oral vitamin K (2.5-5 mg)</li>
                      <li>• Recheck INR in 12-24 hours</li>
                      <li>• May need to repeat vitamin K</li>
                      <li>• Contact healthcare provider immediately</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6 p-6 bg-red-100 border-2 border-red-300 rounded-lg">
                <h3 className="text-xl font-bold text-red-800 mb-2">
                  ⚠️ Seek Immediate Medical Attention If:
                </h3>
                <ul className="space-y-1 text-red-700">
                  <li>• Any significant bleeding occurs</li>
                  <li>• Signs of internal bleeding (severe headache, abdominal pain)</li>
                  <li>• INR &gt;9.0 with any bleeding</li>
                  <li>• Fall or head injury while on warfarin</li>
                </ul>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-6 flex items-center">
                <Heart className="h-8 w-8 mr-3 text-primary" />
                Vitamin K for INR Reversal
              </h2>
              
              <Card>
                <CardHeader>
                  <CardTitle>When and How to Use Vitamin K</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Oral Vitamin K (Preferred for non-urgent reversal)</h4>
                      <ul className="space-y-1 text-gray-600">
                        <li>• Takes 12-24 hours for full effect</li>
                        <li>• Can use tablet form or IV preparation given orally</li>
                        <li>• Mix IV form with orange juice to mask taste</li>
                        <li>• Typical doses: 1-5 mg depending on INR level</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">IV Vitamin K (For urgent reversal)</h4>
                      <ul className="space-y-1 text-gray-600">
                        <li>• Works faster initially but similar to oral at 24 hours</li>
                        <li>• Risk of anaphylaxis (rare but serious)</li>
                        <li>• Reserved for serious bleeding or urgent procedures</li>
                      </ul>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm">
                        <strong>Note:</strong> Avoid subcutaneous vitamin K - it&apos;s less effective 
                        than oral or IV routes.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-6 flex items-center">
                <Activity className="h-8 w-8 mr-3 text-primary" />
                Factors Affecting INR Stability
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Increases INR (Higher bleeding risk)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li>• Antibiotics (many types)</li>
                      <li>• Illness or fever</li>
                      <li>• Decreased vitamin K intake</li>
                      <li>• Alcohol (acute intake)</li>
                      <li>• Some herbal supplements</li>
                      <li>• Liver disease</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Decreases INR (Higher clotting risk)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li>• High vitamin K foods</li>
                      <li>• Missed warfarin doses</li>
                      <li>• Some medications (rifampin)</li>
                      <li>• Vitamin K supplements</li>
                      <li>• Chronic alcohol use</li>
                      <li>• St. John&apos;s Wort</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-6">Tips for Maintaining Stable INR</h2>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3">Medication Management</h3>
                    <ul className="space-y-2 text-sm">
                      <li>✓ Take warfarin at the same time daily</li>
                      <li>✓ Never double up on missed doses</li>
                      <li>✓ Keep a medication diary</li>
                      <li>✓ Tell all providers you take warfarin</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-3">Diet Consistency</h3>
                    <ul className="space-y-2 text-sm">
                      <li>✓ Maintain consistent vitamin K intake</li>
                      <li>✓ Don&apos;t avoid vitamin K foods entirely</li>
                      <li>✓ Track significant diet changes</li>
                      <li>✓ Limit alcohol consumption</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-primary/5 p-8 rounded-lg text-center mb-12">
              <h2 className="text-2xl font-bold mb-4">
                Track Your Vitamin K Intake with VitaK Tracker
              </h2>
              <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
                Our app helps you maintain consistent vitamin K intake for stable INR levels. 
                Log meals, track daily credits, and get alerts when approaching limits.
              </p>
              <Link href="/auth/sign-up">
                <Button size="lg">
                  Start Free Tracking
                </Button>
              </Link>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-6">When to Contact Your Healthcare Provider</h2>
              
              <Card className="border-2 border-primary">
                <CardContent className="pt-6">
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>INR significantly above or below target range</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Any unusual bleeding or bruising</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Starting new medications or supplements</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Planned surgery or dental procedures</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Significant illness or dietary changes</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Questions about your warfarin therapy</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </section>

            <div className="bg-gray-100 p-6 rounded-lg text-sm text-gray-600">
              <p>
                <strong>References:</strong> This guide is based on evidence-based clinical 
                guidelines from the American College of Chest Physicians, American Heart Association, 
                and international anticoagulation management protocols. Always follow your healthcare 
                provider&apos;s specific recommendations for your individual situation.
              </p>
            </div>
          </article>
        </main>

        <Footer />
      </div>
    </>
  );
}