import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Heart, Home } from "lucide-react";

export default function DonateSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Heart className="h-16 w-16 text-destructive" />
              <CheckCircle className="h-8 w-8 text-success absolute -bottom-1 -right-1 bg-white rounded-full" />
            </div>
          </div>
          <CardTitle className="text-2xl">Thank You!</CardTitle>
          <CardDescription className="text-base">
            Your donation has been processed successfully
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-muted-foreground">
            <p>
              Your generous support helps us keep VitaK Tracker free and 
              accessible for all warfarin patients. Together, we&apos;re making 
              medication management easier and safer.
            </p>
          </div>
          
          <div className="bg-muted rounded-lg p-4 text-sm">
            <p className="font-medium mb-1">What happens next?</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>You&apos;ll receive a receipt via email from Stripe</li>
              <li>Your donation is tax-deductible where applicable</li>
              <li>100% of donations go toward development and hosting</li>
            </ul>
          </div>

          <div className="flex flex-col gap-2 pt-4">
            <Link href="/dashboard">
              <Button className="w-full" size="lg">
                <Home className="mr-2 h-4 w-4" />
                Return to Dashboard
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full">
                Visit Homepage
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}