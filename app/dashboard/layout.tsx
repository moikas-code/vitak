import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Activity, Home, Settings, UtensilsCrossed } from "lucide-react";
import { DonateButton } from "@/components/donate/donate-button";
import { FeedbackButton } from "@/components/feedback/feedback-button";
import { UserSync } from "@/components/auth/user-sync";
import { MobileMenu } from "@/components/dashboard/mobile-menu";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <UserSync />
      <header className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <MobileMenu />
              <Link href="/dashboard" className="font-bold text-xl">
                VitaK Tracker
              </Link>
              <nav className="hidden md:flex md:ml-8 space-x-6">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  <Home className="h-4 w-4" />
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/log-meal"
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  <UtensilsCrossed className="h-4 w-4" />
                  Log Meal
                </Link>
                <Link
                  href="/dashboard/history"
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  <Activity className="h-4 w-4" />
                  History
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <FeedbackButton variant="ghost" size="sm" className="hidden md:inline-flex" />
              <DonateButton variant="ghost" size="sm" className="hidden md:inline-flex" />
              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8"
                  }
                }}
              />
            </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}