import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
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
  "/api/markdown",
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
  "/api-docs",
  "/api/x402(.*)",
  "/.well-known(.*)",
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

export default clerkMiddleware(async (auth, req: NextRequest) => {
  // ── Markdown content negotiation for AI agents ──────────────────────
  // When Accept: text/markdown is requested, rewrite to the markdown API route
  const acceptHeader = req.headers.get("accept") || "";
  if (acceptHeader.includes("text/markdown")) {
    const path = req.nextUrl.pathname;
    const mdRoutes = ["/", "/api-docs"];
    if (mdRoutes.includes(path)) {
      const mdUrl = new URL("/api/markdown", req.url);
      mdUrl.searchParams.set("path", path);
      return NextResponse.rewrite(mdUrl);
    }
  }

  // Handle CORS for x402 API endpoints
  if (req.nextUrl.pathname.startsWith("/api/x402/")) {
    if (req.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, X-402-Version, X-402-Payment, X-402-Recipient",
          "Access-Control-Max-Age": "86400",
        },
      });
    }
  }

  // Handle CORS for .well-known endpoints (AI discovery)
  if (req.nextUrl.pathname.startsWith("/.well-known/")) {
    const response = NextResponse.next();
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type");
    return response;
  }

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

  // ── Apply security headers + Link headers ─────────────────────────────
  const response = NextResponse.next();
  addSecurityHeaders(response);

  // RFC 8288 Link headers for agent discovery on homepage
  if (req.nextUrl.pathname === "/") {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://vitaktracker.com";
    response.headers.set(
      "Link",
      [
        `<${baseUrl}/.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"; title="VitaK Tracker API Catalog"`,
        `<${baseUrl}/.well-known/openapi.json>; rel="service-desc"; type="application/openapi+json"; title="OpenAPI 3.1 Specification"`,
        `<${baseUrl}/api-docs>; rel="service-doc"; type="text/html"; title="API Documentation"`,
        `<${baseUrl}/llms.txt>; rel="llms-txt"; type="text/plain"; title="VitaK Tracker LLMs.txt"`,
        `<${baseUrl}/.well-known/ai-plugin.json>; rel="ai-plugin"; type="application/json"; title="ChatGPT Plugin Manifest"`,
        `<${baseUrl}/.well-known/agent-skills>; rel="agent-skills"; type="application/json"; title="Agent Skills Discovery Index"`,
        `<${baseUrl}/.well-known/mcp/server-card.json>; rel="mcp-server"; type="application/json"; title="MCP Server Card"`,
        `<${baseUrl}/.well-known/oauth-protected-resource>; rel="oauth-protected-resource"; type="application/json"; title="OAuth Protected Resource Metadata"`,
      ].join(", ")
    );
  }

  return response;
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};