import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { earlyAccess } from "@/db/schema";
import { logger, LogLevel } from "@/lib/logger";

export const dynamic = "force-dynamic";

const COUNTRIES = [
  "Kenya", "Uganda", "Tanzania", "Rwanda", "Nigeria", "Ghana", "South Africa",
  "DRC", "Morocco", "Egypt", "Senegal", "Côte d'Ivoire", "Angola", "Mozambique",
  "Ethiopia", "Zambia", "Zimbabwe", "Other",
].map(String);

const INTERESTS = [
  "I want to predict",
  "I want to run a Chama pool",
  "I'm a developer / partner",
  "Other",
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * POST /api/early-access
 * Body: { email, country, interest }
 * Adds the address to the country-by-country rollout list.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body?.email || "").trim().toLowerCase();
    const country = String(body?.country || "Kenya").trim();
    const interest = String(body?.interest || INTERESTS[0]).trim();

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ success: false, error: "Please enter a valid email address." }, { status: 400 });
    }
    if (!COUNTRIES.includes(country)) {
      return NextResponse.json({ success: false, error: "Please choose a country from the list." }, { status: 400 });
    }

    const inserted = await db
      .insert(earlyAccess)
      .values({ email, country, interest })
      .onConflictDoNothing({ target: earlyAccess.email })
      .returning();

    logger.log(LogLevel.INFO, "Early access signup", {
      metadata: { email: maskEmail(email), country, interest, ip: request.headers.get("x-forwarded-for")?.split(",")[0] },
    });

    if (inserted.length === 0) {
      return NextResponse.json({
        success: true,
        alreadyRegistered: true,
        message: "You're already on the list — we'll email you when Arena opens in your country.",
      });
    }

    return NextResponse.json(
      {
        success: true,
        alreadyRegistered: false,
        message: `You're on the list! We'll email ${maskEmail(email)} when Arena opens in ${country}.`,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  return `${local.slice(0, 2)}•••@${domain}`;
}
