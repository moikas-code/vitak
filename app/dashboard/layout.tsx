import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Activity, Home, Settings, UtensilsCrossed, Calculator, FileText } from "lucide-react";
import { DonateButton } from "@/components/donate/donate-button";
import { FeedbackButton } from "@/components/feedback/feedback-button";
import { UserSync } from "@/components/auth/user-sync";
import { MobileMenu } from "@/components/dashboard/mobile-menu";
import { ConnectionIndicator } from "@/components/offline/connection-indicator";
import { OfflineInitializer } from "@/components/offline/offline-initializer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <UserSync />
      <OfflineInitializer />
      <ConnectionIndicator />
      <header className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <MobileMenu />
              <Link href="/dashboard" className="font-bold text-xl">
                VitaK Tracker
              </Link>
              <nav className="hidden lg:flex lg:ml-8 space-x-4">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 px-2 py-1 rounded-md hover:bg-gray-50"
                >
                  <Home className="h-4 w-4" />
                  Dashboard
                </Link>

                <Link
                  href="/dashboard/log-meal"
                  className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 px-2 py-1 rounded-md hover:bg-gray-50"
                >
                  <UtensilsCrossed className="h-4 w-4" />
                  Log Meal
                </Link>
                <Link
                  href="/dashboard/history"
                  className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 px-2 py-1 rounded-md hover:bg-gray-50"
                >
                  <Activity className="h-4 w-4" />
                  History
                </Link>

                <Link
                  href="/dashboard/settings"
                  className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 px-2 py-1 rounded-md hover:bg-gray-50"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>

              </nav>

              {/* Medium screens: Show core items only */}
              <nav className="hidden md:flex lg:hidden md:ml-6 space-x-3">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900 px-2 py-1 rounded-md hover:bg-gray-50"
                >
                  <Home className="h-4 w-4" />
                  <span className="hidden xl:block">Dashboard</span>
                </Link>

                <Link
                  href="/dashboard/log-meal"
                  className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900 px-2 py-1 rounded-md hover:bg-gray-50"
                >
                  <UtensilsCrossed className="h-4 w-4" />
                  <span className="hidden xl:block">Log</span>
                </Link>
                <Link
                  href="/dashboard/history"
                  className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900 px-2 py-1 rounded-md hover:bg-gray-50"
                >
                  <Activity className="h-4 w-4" />
                  <span className="hidden xl:block">History</span>
                </Link>

                <Link
                  href="/dashboard/settings"
                  className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900 px-2 py-1 rounded-md hover:bg-gray-50"
                >
                  <Settings className="h-4 w-4" />
                  <span className="hidden xl:block">Settings</span>
                </Link>
                

              </nav>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/vitamin-k-calculator"
                className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900 px-2 py-1 rounded-md hover:bg-gray-50"
              >
                <Calculator className="h-4 w-4" />
                <span className="hidden xl:block">Calc</span>
              </Link>
              <Link
                href="/warfarin-food-chart"
                className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900 px-2 py-1 rounded-md hover:bg-gray-50"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden xl:block">Chart</span>
              </Link>
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