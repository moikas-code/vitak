import { describe, it, expect } from "vitest";
import {
  getSecurityHeaders,
  withSecurityHeaders,
  createSecureResponse,
  jsonResponseWithHeaders,
} from "@/lib/security/headers";

describe("getSecurityHeaders", () => {
  it("should return all default security headers", () => {
    const headers = getSecurityHeaders();

    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["X-Frame-Options"]).toBe("DENY");
    expect(headers["X-XSS-Protection"]).toBe("1; mode=block");
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["Permissions-Policy"]).toContain("camera=()");
    expect(headers["Permissions-Policy"]).toContain("microphone=()");
    expect(headers["Permissions-Policy"]).toContain("geolocation=()");
  });

  it("should not include HSTS by default", () => {
    const headers = getSecurityHeaders();
    expect(headers["Strict-Transport-Security"]).toBeUndefined();
  });

  it("should include HSTS when requested", () => {
    const headers = getSecurityHeaders({ includeHSTS: true });
    expect(headers["Strict-Transport-Security"]).toBe(
      "max-age=31536000; includeSubDomains; preload"
    );
  });

  it("should not include CSP by default", () => {
    const headers = getSecurityHeaders();
    expect(headers["Content-Security-Policy"]).toBeUndefined();
  });

  it("should include CSP when requested", () => {
    const headers = getSecurityHeaders({ includeCSP: true });
    expect(headers["Content-Security-Policy"]).toContain("default-src 'self'");
  });

  it("should include both HSTS and CSP when both requested", () => {
    const headers = getSecurityHeaders({ includeHSTS: true, includeCSP: true });
    expect(headers["Strict-Transport-Security"]).toBeDefined();
    expect(headers["Content-Security-Policy"]).toBeDefined();
  });
});

describe("withSecurityHeaders", () => {
  it("should add security headers to an existing Response", () => {
    const response = new Response("OK");
    const secured = withSecurityHeaders(response);

    expect(secured.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(secured.headers.get("X-Frame-Options")).toBe("DENY");
  });

  it("should preserve existing response body", async () => {
    const body = "Hello World";
    const response = new Response(body);
    const secured = withSecurityHeaders(response);

    expect(await secured.text()).toBe(body);
  });
});

describe("createSecureResponse", () => {
  it("should create a Response with security headers", () => {
    const response = createSecureResponse("test body");

    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("X-Frame-Options")).toBe("DENY");
  });

  it("should create a Response with custom status", () => {
    const response = createSecureResponse("not found", { status: 404 });
    expect(response.status).toBe(404);
  });

  it("should include HSTS when requested", () => {
    const response = createSecureResponse("ok", undefined, { includeHSTS: true });
    expect(response.headers.get("Strict-Transport-Security")).toBeDefined();
  });
});

describe("jsonResponseWithHeaders", () => {
  it("should create a JSON response with security headers", () => {
    const data = { message: "success" };
    const response = jsonResponseWithHeaders(data);

    expect(response.headers.get("Content-Type")).toBe("application/json");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });

  it("should serialize data to JSON", async () => {
    const data = { foo: "bar", count: 42 };
    const response = jsonResponseWithHeaders(data);
    const parsed = JSON.parse(await response.text());

    expect(parsed).toEqual(data);
  });

  it("should support custom status codes", () => {
    const response = jsonResponseWithHeaders({ error: "Not found" }, { status: 404 });
    expect(response.status).toBe(404);
  });
});