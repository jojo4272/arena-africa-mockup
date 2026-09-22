import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generatePhoneToken, verifyPin } from "@/lib/auth";
import { logger, LogLevel } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/login
 * Body: { userId } or { phoneNumber }, optional { pin }
 * Returns: { success, token, user }
 *
 * Demo mode: userId alone issues a token (profile switching).
 * Production: set a pinHash on the user and require `pin`.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, phoneNumber, pin } = body;

    if (!userId && !phoneNumber) {
      return NextResponse.json(
        { success: false, error: "userId or phoneNumber required" },
        { status: 400 }
      );
    }

    const result = userId
      ? await db.select().from(users).where(eq(users.id, Number(userId)))
      : await db.select().from(users).where(eq(users.phoneNumber, String(phoneNumber)));

    const user = result[0];
    if (!user) {
      logger.security("Login attempt for unknown user", {
        metadata: { userId, phoneNumber, ip: request.headers.get("x-forwarded-for")?.split(",")[0] },
      });
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // If user has a PIN set, require it
    if (user.pinHash) {
      if (!pin) {
        return NextResponse.json({ success: false, error: "PIN required" }, { status: 401 });
      }
      // pinHash stored as "salt:hash"
      const [salt, hash] = user.pinHash.split(":");
      if (!salt || !hash || !verifyPin(String(pin), salt, hash)) {
        logger.security("Failed PIN attempt", { userId: user.id });
        return NextResponse.json({ success: false, error: "Invalid PIN" }, { status: 401 });
      }
    }

    const token = generatePhoneToken(user.id, user.phoneNumber);
    logger.log(LogLevel.INFO, "User logged in", { userId: user.id });

    const res = NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        country: user.country,
        currency: user.currency,
        balance: user.balance,
      },
    });

    // httpOnly session cookie — secures both API routes AND server actions
    res.cookies.set("arena_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24h
    });

    return res;
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
