import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/ui/mobile-nav";

interface PublicHeaderProps {
  showSignUp?: boolean;
}

export function PublicHeader({ showSignUp = true }: PublicHeaderProps) {
  return (
    <header className="bg-white border-b">
      <div className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-gray-900">
            VitaK Tracker
          </Link>
          <div className="flex items-center gap-4">
            {showSignUp && (
              <div className="hidden md:block">
                <Link href="/auth/sign-up">
                  <Button>Start Tracking</Button>
                </Link>
              </div>
            )}
            <MobileNav />
          </div>
        </nav>
      </div>
    </header>
  );
}