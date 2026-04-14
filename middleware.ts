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

function addSecurityHeaders(response: NextResponse) {
  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY");
  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");
  // XSS protection (legacy browsers)
  response.headers.set("X-XSS-Protection", "1; mode=block");
  // Referrer policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  // Disable unnecessary browser features
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );
  // HSTS — enforce HTTPS for 1 year with subdomains
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }
  // Content Security Policy
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https://img.clerk.com https://*.clerk.com",
      "connect-src 'self' https: wss:",
      "frame-src https://challenges.cloudflare.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ")
  );
  return response;
}

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

  // Apply security headers to all responses
  const response = NextResponse.next();
  return addSecurityHeaders(response);
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};