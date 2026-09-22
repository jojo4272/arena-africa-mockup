import { NextRequest, NextResponse } from "next/server";
import { securityHeaders } from "@/lib/security";
import { logger, LogLevel } from "@/lib/logger";

export async function securityMiddleware(request: NextRequest) {
  // NIST CSF PROTECT: Apply security headers to all responses
  // NIST CSF DETECT: Log all requests for audit trail

  const url = request.nextUrl;
  const method = request.method;
  const userAgent = request.headers.get("user-agent") || "unknown";
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";

  // Log request (anonymized for privacy - no user identification without auth)
  logger.log(LogLevel.INFO, `Request: ${method} ${url.pathname}`, {
    ip: ip.split(",")[0],
    metadata: {
      method,
      userAgent: userAgent.substring(0, 50),
    },
  });

  // Continue with request but add security headers to response
  const response = NextResponse.next();

  // Apply NIST CSF security headers
  await securityHeaders(request, response.headers);

  // Add rate limit info headers (even if not rate limited)
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");

  return response;
}
