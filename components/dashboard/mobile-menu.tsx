"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Activity, Home, Settings, UtensilsCrossed, Calculator, FileText } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { DonateButton } from "@/components/donate/donate-button";
import { FeedbackButton } from "@/components/feedback/feedback-button";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Calculator", href: "/vitamin-k-calculator", icon: Calculator },
  { name: "Log Meal", href: "/dashboard/log-meal", icon: UtensilsCrossed },
  { name: "History", href: "/dashboard/history", icon: Activity },
  { name: "Food Chart", href: "/warfarin-food-chart", icon: FileText },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function MobileMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[350px]">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <nav className="mt-6 flex flex-col gap-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
          
          <div className="mt-4 pt-4 border-t">
            <div className="flex flex-col gap-3">
              <FeedbackButton 
                className="w-full justify-start" 
                variant="outline"
                showText={true}
              />
              <DonateButton 
                className="w-full justify-start" 
                variant="outline"
                showText={true}
              />
            </div>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}