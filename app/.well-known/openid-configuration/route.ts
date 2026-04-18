import { NextResponse } from "next/server";

/**
 * OpenID Connect Discovery (openid-connect-discovery-1_0.html)
 * Proxies Clerk's OIDC metadata so agents can discover auth
 * at the resource's own domain per the OIDC spec.
 *
 * The issuer remains https://clerk.vitaktracker.com (Clerk's domain)
 * per spec requirements — the discovery document just lives here
 * so agents find it at the expected well-known path on our domain.
 */
export async function GET() {
  const clerkBaseUrl = process.env.NEXT_PUBLIC_CLERK_ISSUER || "https://clerk.vitaktracker.com";

  try {
    const upstream = await fetch(`${clerkBaseUrl}/.well-known/openid-configuration`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: "Failed to fetch OIDC discovery from upstream", status: upstream.status },
        { status: 502 }
      );
    }

    const data = await upstream.json();

    return NextResponse.json(data, {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    // Fallback: return a static discovery document pointing to Clerk
    const discovery = {
      issuer: clerkBaseUrl,
      authorization_endpoint: `${clerkBaseUrl}/oauth/authorize`,
      token_endpoint: `${clerkBaseUrl}/oauth/token`,
      userinfo_endpoint: `${clerkBaseUrl}/oauth/userinfo`,
      jwks_uri: `${clerkBaseUrl}/.well-known/jwks.json`,
      revocation_endpoint: `${clerkBaseUrl}/oauth/token/revoke`,
      introspection_endpoint: `${clerkBaseUrl}/oauth/token_info`,
      response_types_supported: ["code"],
      response_modes_supported: ["query"],
      subject_types_supported: ["public"],
      id_token_signing_alg_values_supported: ["RS256"],
      scopes_supported: ["openid", "profile", "email", "offline_access"],
      token_endpoint_auth_methods_supported: ["client_secret_post", "client_secret_basic"],
      claims_supported: ["aud", "email", "email_verified", "exp", "iat", "iss", "name", "picture", "sub"],
      code_challenge_methods_supported: ["S256"],
      grant_types_supported: ["authorization_code", "refresh_token"],
    };

    return NextResponse.json(discovery, {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Cache-Control": "public, max-age=300",
      },
    });
  }
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