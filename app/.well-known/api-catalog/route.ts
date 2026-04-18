import { NextResponse } from "next/server";

/**
 * RFC 9727 / RFC 9264 — API Catalog
 * Returns application/linkset+json describing the VitaK Tracker API,
 * its OpenAPI spec, documentation, and health/status endpoint.
 */
export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://vitaktracker.com";

  const linkset = {
    linkset: [
      {
        anchor: `${baseUrl}/api`,
        title: "VitaK Tracker API — Vitamin K Food Data",
        "service-desc": [
          {
            href: `${baseUrl}/.well-known/openapi.json`,
            type: "application/openapi+json",
            title: "OpenAPI 3.1 Specification",
          },
        ],
        "service-doc": [
          {
            href: `${baseUrl}/api-docs`,
            type: "text/html",
            title: "API Documentation",
          },
          {
            href: `${baseUrl}/llms.txt`,
            type: "text/plain",
            title: "LLMs.txt Project Description",
          },
        ],
        status: [
          {
            href: `${baseUrl}/.well-known/x402`,
            type: "application/json",
            title: "x402 Service Discovery & Payment Endpoints",
          },
        ],
        "api-catalog": [
          {
            href: `${baseUrl}/.well-known/api-catalog`,
            type: "application/linkset+json",
            title: "This Document",
          },
        ],
      },
    ],
  };

  return NextResponse.json(linkset, {
    headers: {
      "Content-Type": "application/linkset+json",
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