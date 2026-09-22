// NIST CSF PROTECT (Data Security, Access Control)
// NIST CSF DETECT (Anomaly Detection)

import { NextRequest, NextResponse } from "next/server";
import { verifyPhoneToken } from "@/lib/auth";

// Rate limit storage (in-memory for demo; use Redis for production)
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimits = new Map<string, RateLimitEntry>();

export function rateLimit(key: string, maxRequests: number = 30, windowMs: number = 60000) {
  const now = Date.now();
  const entry = rateLimits.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimits.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, retryAfter: Math.ceil((entry.resetTime - now) / 1000) };
  }

  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count };
}

export async function securityHeaders(request: NextRequest, responseHeaders: Headers) {
  // NIST CSF PROTECT: Security Headers
  responseHeaders.set("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://api.*;");
  responseHeaders.set("X-Content-Type-Options", "nosniff");
  responseHeaders.set("X-Frame-Options", "DENY");
  responseHeaders.set("X-XSS-Protection", "1; mode=block");
  responseHeaders.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  responseHeaders.set("Referrer-Policy", "strict-origin-when-cross-origin");
  responseHeaders.set("Permissions-Policy", "geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=(), ambient-light-sensor=()");
  responseHeaders.set("Cross-Origin-Resource-Policy", "same-origin");
  responseHeaders.set("Cross-Origin-Opener-Policy", "same-origin");
}

export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  return forwarded?.split(",")[0] || realIP || "unknown";
}
