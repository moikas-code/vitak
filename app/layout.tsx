import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { TRPCProvider } from "@/lib/trpc/provider";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://vitaktracker.com'),
  title: {
    default: "VitaK Tracker - Vitamin K Management for Warfarin Patients",
    template: "%s | VitaK Tracker"
  },
  description: "Track vitamin K intake while on warfarin with our free diet management app. Monitor daily credits, access comprehensive food database, and maintain stable INR levels.",
  keywords: ["vitamin k tracker", "warfarin diet", "INR management", "coumadin food tracking", "vitamin k foods", "anticoagulation diet", "blood thinner diet app", "warfarin vitamin k calculator"],
  authors: [{ name: "VitaK Tracker Team" }],
  creator: "VitaK Tracker",
  publisher: "VitaK Tracker",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: "/manifest.json",
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": "/blog/rss.xml",
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "VitaK Tracker",
  },
  openGraph: {
    title: "VitaK Tracker - Vitamin K Management for Warfarin Patients",
    description: "Track vitamin K intake while on warfarin. Free diet management app with daily credits, comprehensive food database, and INR stability tools.",
    url: "/",
    siteName: "VitaK Tracker",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "VitaK Tracker - Vitamin K Management App",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VitaK Tracker - Vitamin K Management for Warfarin",
    description: "Free app to track vitamin K intake while on warfarin. Monitor daily credits and maintain stable INR levels.",
    images: ["/twitter-image.png"],
    creator: "@vitaktracker",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "health",
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head />
        <body className={`${inter.variable} font-sans antialiased`}>
          <TRPCProvider>
            {children}
            <Toaster />
          </TRPCProvider>
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}