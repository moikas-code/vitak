"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Calculator, FileText, Apple, BookOpen, Home } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Vitamin K Calculator", href: "/vitamin-k-calculator", icon: Calculator },
  { name: "Printable Food Chart", href: "/warfarin-food-chart", icon: FileText },
  { name: "Food Guide", href: "/vitamin-k-foods-warfarin", icon: Apple },
  { name: "Diet Tracker Info", href: "/warfarin-diet-tracker", icon: BookOpen },
];

interface MobileNavProps {
  isAuthenticated?: boolean;
}

export function MobileNav({ isAuthenticated = false }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open navigation menu"
          aria-expanded={open}
          aria-controls="mobile-navigation"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[350px]" id="mobile-navigation" aria-label="Navigation menu">
        <SheetHeader>
          <SheetTitle>VitaK Tracker</SheetTitle>
        </SheetHeader>
        <nav className="mt-6 flex flex-col gap-2" role="navigation">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          ))}
          
          <div className="mt-6 pt-6 border-t space-y-3">
            {isAuthenticated ? (
              <Link href="/dashboard" onClick={() => setOpen(false)}>
                <Button className="w-full">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/auth/sign-up" onClick={() => setOpen(false)}>
                  <Button className="w-full">
                    Get Started Free
                  </Button>
                </Link>
                <Link href="/auth/sign-in" onClick={() => setOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}