import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { rateLimit, getClientIP, securityHeaders } from "@/lib/security";
import { logger } from "@/lib/logger";

/**
 * Next.js 16 network boundary for API throttling and response hardening.
 * Public pages stay outside the proxy; mutation routes additionally enforce
 * signed authentication in their route handlers.
 */
export async function proxy(request: NextRequest) {
  // Health probes are intentionally exempt from throttling.
  if (request.nextUrl.pathname === "/api/health") {
    const response = NextResponse.next();
    await securityHeaders(request, response.headers);
    return response;
  }

  const clientIP = getClientIP(request);
  const endpoint = request.nextUrl.pathname;
  const rateKey = `${clientIP}:${endpoint}`;
  const maxRequests = request.method === "GET" ? 60 : 20;
  const result = rateLimit(rateKey, maxRequests, 60_000);

  if (!result.allowed) {
    logger.security("Rate limit exceeded", {
      metadata: {
        ip: clientIP,
        endpoint,
        method: request.method,
        retryAfter: result.retryAfter,
      },
    });

    const response = NextResponse.json(
      {
        success: false,
        error: "Too many requests. Please try again later.",
        retryAfter: result.retryAfter,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(result.retryAfter || 60),
          "X-RateLimit-Limit": String(maxRequests),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
    await securityHeaders(request, response.headers);
    return response;
  }

  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Limit", String(maxRequests));
  response.headers.set("X-RateLimit-Remaining", String(result.remaining ?? 0));
  await securityHeaders(request, response.headers);
  return response;
}

export const config = {
  matcher: "/api/:path*",
};
