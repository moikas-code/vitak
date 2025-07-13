import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

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
  if (!isPublicRoute(req)) {
    await auth.protect();
    
    // Check admin access for admin routes
    if (isAdminRoute(req)) {
      const user = await auth();
      
      if (!user?.userId) {
        return NextResponse.redirect(new URL('/auth/sign-in', req.url));
      }
      
      // Temporary: Check role in database until JWT template is working
      try {
        const { supabaseServiceRole } = await import("@/lib/db/supabase-server");
        const { data } = await supabaseServiceRole
          .from("user_settings")
          .select("role")
          .eq("user_id", user.userId)
          .single();
        
        console.log('[Middleware] Database role check:', data?.role);
        
        if (data?.role !== 'admin') {
          console.log('[Middleware] Access denied - user role:', data?.role);
          return NextResponse.redirect(new URL('/dashboard', req.url));
        }
        
        console.log('[Middleware] Admin access granted for user:', user.userId);
      } catch (error) {
        console.error('[Middleware] Error checking admin role:', error);
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};