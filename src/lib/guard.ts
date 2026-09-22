// NIST CSF PROTECT (Access Control) — enforces auth on API routes
// This is the missing link: auth.ts was built but never wired in. Now routes call this.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPhoneToken } from "@/lib/auth";
import { logger, LogLevel } from "@/lib/logger";

export interface GuardResult {
  ok: boolean;
  user?: any;
  response?: NextResponse;
}

/**
 * Require a valid authenticated user on a mutation endpoint.
 * Accepts: Authorization: Bearer <jwt>
 */
export async function requireUser(request: NextRequest): Promise<GuardResult> {
  const authHeader = request.headers.get("authorization");

  // Accept Bearer header OR httpOnly session cookie (covers browser + server actions)
  let token: string | null = null;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.slice(7).trim();
  } else {
    token = request.cookies.get("arena_token")?.value || null;
  }

  if (!token) {
    logger.security("Missing credentials on mutation endpoint", {
      metadata: { endpoint: request.nextUrl.pathname, method: request.method, ip: getIp(request) },
    });
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: "Unauthorized. Bearer token or session cookie required." },
        { status: 401 }
      ),
    };
  }

  const verified = verifyPhoneToken(token);

  if (!verified?.valid) {
    logger.security("Invalid or expired token", {
      metadata: { endpoint: request.nextUrl.pathname, ip: getIp(request) },
    });
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: "Unauthorized. Invalid or expired token." },
        { status: 401 }
      ),
    };
  }

  const result = await db.select().from(users).where(eq(users.id, verified.userId));
  const user = result[0];

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ success: false, error: "Unauthorized. User not found." }, { status: 401 }),
    };
  }

  return { ok: true, user };
}

function getIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "unknown";
}
