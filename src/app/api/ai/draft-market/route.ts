import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/guard";
import { evaluatePolicy } from "@/lib/policy";
import { draftMarket, moderateMarket, geminiConfigured } from "@/lib/gemini";
import { isRole } from "@/lib/rbac";
import { logger, LogLevel } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * POST /api/ai/draft-market
 * Turns a plain-language idea into a publish-ready market, then runs it
 * through AI moderation. Requires the 'ai:generate' capability.
 */
export async function POST(request: NextRequest) {
  const guard = await requireUser(request);
  if (!guard.ok) return guard.response!;
  const user = guard.user!;
  const role = isRole(user.role) ? user.role : "MEMBER";

  const decision = evaluatePolicy({
    action: "ai:generate",
    subject: {
      userId: user.id,
      role,
      status: user.status,
      kycTier: user.kycTier,
      countryCode: user.countryCode,
      currency: user.currency,
      balance: user.balance,
    },
    resource: { type: "ai" },
    channel: "WEB",
  });

  if (!decision.allowed) {
    return NextResponse.json({ success: false, error: decision.reasons.join(" "), policy: decision }, { status: 403 });
  }

  try {
    const { idea } = await request.json();
    if (!idea || String(idea).trim().length < 6) {
      return NextResponse.json({ success: false, error: "Describe the market idea in a few words." }, { status: 400 });
    }

    const drafted = await draftMarket(String(idea), user.country);
    const draft = drafted.data!;
    const moderation = await moderateMarket(draft.title, draft.description);

    logger.log(LogLevel.INFO, "AI market draft generated", {
      userId: user.id,
      metadata: { source: drafted.source, decision: moderation.data?.decision },
    });

    return NextResponse.json({
      success: true,
      data: {
        draft,
        moderation: moderation.data,
        aiSource: drafted.source,
        geminiConfigured: geminiConfigured(),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
