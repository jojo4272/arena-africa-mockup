// NIST CSF PROTECT (Data Security / Rate Limiting) / DETECT (Anomaly Detection)
// Rate limiting middleware for Arena Africa API endpoints

import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIP } from "@/lib/security";
import { logger, LogLevel } from "@/lib/logger";

export async function rateLimitMiddleware(
  request: NextRequest,
  maxRequests: number = 30,
  windowMs: number = 60000
): Promise<NextResponse | null> {
  const clientIP = getClientIP(request);
  const endpoint = request.nextUrl.pathname;
  const rateKey = `${clientIP}:${endpoint}`;

  const result = rateLimit(rateKey, maxRequests, windowMs);

  if (!result.allowed) {
    logger.security("Rate limit exceeded", {
      ip: clientIP,
      metadata: {
        endpoint,
        requestsMade: maxRequests,
        retryAfter: result.retryAfter,
      },
    });

    return NextResponse.json(
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
  }

  return null; // Continue to endpoint
}
