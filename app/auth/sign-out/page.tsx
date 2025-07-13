import { SignOutButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignOutPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign Out</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Are you sure you want to sign out?
          </p>
          <SignOutButton redirectUrl="/">
            <Button className="w-full">Sign Out</Button>
          </SignOutButton>
        </CardContent>
      </Card>
    </div>
  );
}