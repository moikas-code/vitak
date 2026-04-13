import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { userSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/api/trpc(.*)",
  "/api/feedback",
  "/admin(.*)",
]);

const isAdminRoute = createRouteMatcher([
  "/admin(.*)",
]);

const isPublicRoute = createRouteMatcher([
  "/",
  "/login",
  "/auth/sign-in(.*)",
  "/auth/sign-up(.*)",
  "/donate/success",
  "/api/stripe(.*)",
  "/api/auth/sync-user",
  "/api/clerk/webhook",
  "/api/debug/role",
  "/test-admin",
  "/debug-session",
  "/privacy",
  "/terms",
  "/vitamin-k-foods-warfarin",
  "/vitamin-k-calculator",
  "/warfarin-food-chart",
  "/warfarin-diet-tracker",
  "/inr-vitamin-k-management",
  "/install",
  "/faq",
  "/blog(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // Force HTTPS in production
  if (process.env.NODE_ENV === "production" && req.headers.get("x-forwarded-proto") === "http") {
    const httpsUrl = new URL(req.url);
    httpsUrl.protocol = "https:";
    return NextResponse.redirect(httpsUrl, 308);
  }

  const { userId } = await auth();

  if (!isPublicRoute(req)) {
    if (!userId) {
      const signInUrl = new URL("/auth/sign-in", req.url);
      signInUrl.searchParams.set("redirect_url", req.url);
      return NextResponse.redirect(signInUrl);
    }

    // Check admin access for admin routes
    if (isAdminRoute(req)) {
      try {
        const db = await getDb();
        const settings = await db
          .select({ role: userSettings.role })
          .from(userSettings)
          .where(eq(userSettings.userId, userId))
          .get();

        if (settings?.role !== "admin") {
          return NextResponse.redirect(new URL("/dashboard", req.url));
        }
      } catch (error) {
        console.error("[Middleware] Error checking admin role:", error);
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};