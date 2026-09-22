import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, policyAudit } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generatePhoneToken, hashPin, generateSalt } from "@/lib/auth";
import { resolveGeo, profileFor, bonusFor, countryFromPhone, extractIp } from "@/lib/geo";
import { evaluatePolicy } from "@/lib/policy";
import { logger, LogLevel } from "@/lib/logger";
import { withTransaction } from "@/lib/transactions";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/register — automated, geo-aware registration.
 *
 * Automation performed server-side (no user input required):
 *   • IP / edge-header → country
 *   • Country → currency, locale, dial code
 *   • Phone dial-code → country correction (beats IP when they disagree)
 *   • Currency → localized welcome bonus
 *   • Jurisdiction policy check before the account is created
 *   • Session issued immediately (httpOnly cookie) — one-step onboarding
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const name = String(body?.name || "").trim();
    const phoneRaw = String(body?.phoneNumber || "").trim();
    const pin = body?.pin ? String(body.pin) : null;
    const channel = String(body?.channel || "WEB").toUpperCase() as "WEB" | "MOBILE" | "USSD" | "API";

    if (!name || name.length < 2) {
      return NextResponse.json({ success: false, error: "Please enter your full name." }, { status: 400 });
    }
    if (!/^\+?[\d\s-]{7,18}$/.test(phoneRaw)) {
      return NextResponse.json({ success: false, error: "Enter a valid phone number, e.g. +254712345678." }, { status: 400 });
    }
    const phoneNumber = phoneRaw.replace(/[\s-]/g, "");

    // --- Automated geo/currency resolution -------------------------------
    const geo = await resolveGeo(request.headers);
    // A dial code is stronger evidence of residence than a proxied IP.
    const phoneCountry = countryFromPhone(phoneNumber);
    const explicitCountry = typeof body?.countryCode === "string" ? body.countryCode.toUpperCase() : null;
    const countryCode = explicitCountry || phoneCountry || geo.countryCode;
    const profile = profileFor(countryCode);
    const currency = profile.currency;
    const balance = bonusFor(currency);
    const ip = extractIp(request.headers);

    // --- Policy gate before any write ------------------------------------
    const decision = evaluatePolicy({
      action: "prediction:place", // registration implies intent to stake
      subject: { role: "MEMBER", status: "ACTIVE", kycTier: "BASIC", countryCode, currency, balance },
      channel,
      ip,
    });

    await db.insert(policyAudit).values({
      action: "auth:register",
      effect: decision.effect,
      codes: decision.codes.join(",") || "NONE",
      reasons: decision.reasons.join(" | ").slice(0, 900),
      channel,
      ip,
    }).catch(() => undefined);

    if (decision.effect === "DENY") {
      logger.security("Registration blocked by policy", {
        metadata: { countryCode, codes: decision.codes, ip },
      });
      return NextResponse.json(
        { success: false, error: decision.reasons.join(" "), codes: decision.codes, policy: decision },
        { status: 403 }
      );
    }

    // --- Duplicate check --------------------------------------------------
    const existing = await db.select().from(users).where(eq(users.phoneNumber, phoneNumber));
    if (existing[0]) {
      return NextResponse.json(
        { success: false, error: "That phone number already has an account. Please sign in instead.", code: "ALREADY_REGISTERED" },
        { status: 409 }
      );
    }

    // --- Create + issue session ------------------------------------------
    const created = await withTransaction(async () => {
      const pinHash = pin ? `${generateSalt()}:${""}` : null;
      let storedPin: string | null = null;
      if (pin) {
        const salt = generateSalt();
        storedPin = `${salt}:${hashPin(pin, salt)}`;
      }
      void pinHash;

      const rows = await db
        .insert(users)
        .values({
          name,
          phoneNumber,
          country: profile.country,
          countryCode,
          currency,
          locale: profile.locale,
          balance,
          role: "MEMBER",
          status: "ACTIVE",
          kycTier: "BASIC",
          signupIp: ip,
          signupSource: channel,
          pinHash: storedPin,
        })
        .returning();
      return rows[0];
    });

    const token = generatePhoneToken(created.id, created.phoneNumber);

    logger.log(LogLevel.INFO, "Automated registration completed", {
      userId: created.id,
      metadata: { countryCode, currency, geoSource: geo.source, phoneCountry, channel },
    });

    const res = NextResponse.json(
      {
        success: true,
        token,
        automation: {
          detectedCountry: geo.countryCode,
          detectedVia: geo.source,
          phoneCountry,
          appliedCountry: countryCode,
          appliedCurrency: currency,
          appliedLocale: profile.locale,
          welcomeBonus: balance,
        },
        policy: { effect: decision.effect, obligations: decision.obligations },
        user: {
          id: created.id,
          name: created.name,
          phoneNumber: created.phoneNumber,
          country: created.country,
          currency: created.currency,
          balance: created.balance,
          role: created.role,
          kycTier: created.kycTier,
        },
      },
      { status: 201 }
    );

    res.cookies.set("arena_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return res;
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
