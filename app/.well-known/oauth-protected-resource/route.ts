import { NextResponse } from "next/server";

/**
 * RFC 9728 — OAuth 2.0 Protected Resource Metadata
 * Tells agents which authorization server (Clerk) can issue tokens
 * for this resource and what scopes are available.
 */
export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://vitaktracker.com";
  const clerkIssuer = process.env.NEXT_PUBLIC_CLERK_ISSUER || "https://clerk.vitaktracker.com";

  const metadata = {
    resource: baseUrl,
    authorization_servers: [clerkIssuer],
    scopes_supported: ["openid", "profile", "email"],
    bearer_methods_supported: ["header"],
    resource_documentation: `${baseUrl}/api-docs`,
    resource_signing_alg_values_supported: ["RS256"],
  };

  return NextResponse.json(metadata, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}