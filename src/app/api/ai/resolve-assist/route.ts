import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { markets } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/guard";
import { evaluatePolicy } from "@/lib/policy";
import { resolutionAdvice, geminiConfigured } from "@/lib/gemini";
import { isRole } from "@/lib/rbac";
import { logger, LogLevel } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * POST /api/ai/resolve-assist
 * Resolver-only decision support. Never settles a market itself — it
 * recommends, and the human resolver acts via PATCH /api/markets/[id].
 */
export async function POST(request: NextRequest) {
  const guard = await requireUser(request);
  if (!guard.ok) return guard.response!;
  const user = guard.user!;
  const role = isRole(user.role) ? user.role : "MEMBER";

  try {
    const { marketId, evidence } = await request.json();
    if (!marketId) {
      return NextResponse.json({ success: false, error: "marketId is required" }, { status: 400 });
    }

    const rows = await db.select().from(markets).where(eq(markets.id, Number(marketId)));
    const market = rows[0];
    if (!market) {
      return NextResponse.json({ success: false, error: "Market not found" }, { status: 404 });
    }

    const decision = evaluatePolicy({
      action: "ai:assist_resolution",
      subject: {
        userId: user.id,
        role,
        status: user.status,
        kycTier: user.kycTier,
        countryCode: user.countryCode,
        currency: user.currency,
      },
      resource: { type: "market", id: market.id, status: market.status },
      channel: "WEB",
    });

    if (!decision.allowed) {
      logger.security("Resolution assist denied", {
        userId: user.id,
        metadata: { role, codes: decision.codes },
      });
      return NextResponse.json(
        { success: false, error: decision.reasons.join(" "), policy: decision },
        { status: 403 }
      );
    }

    const advice = await resolutionAdvice(market.title, String(evidence || ""));

    logger.log(LogLevel.INFO, "AI resolution advice issued", {
      userId: user.id,
      metadata: { marketId: market.id, recommendation: advice.data?.recommendation },
    });

    return NextResponse.json({
      success: true,
      data: {
        marketId: market.id,
        title: market.title,
        advice: advice.data,
        aiSource: advice.source,
        geminiConfigured: geminiConfigured(),
        note: "Advisory only. A human resolver must confirm settlement.",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
