import { NextRequest, NextResponse } from "next/server";
import { ensureSeeded } from "@/db/seed";
import { db } from "@/db";
import { predictions, markets, users, transactions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireUser } from "@/lib/guard";
import { withTransaction } from "@/lib/transactions";
import { logger, LogLevel } from "@/lib/logger";
import { evaluatePolicy } from "@/lib/policy";
import { isRole } from "@/lib/rbac";
import { policyAudit } from "@/db/schema";
import { extractIp } from "@/lib/geo";

export const dynamic = "force-dynamic";

function generateRef(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "WL";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// GET /api/predictions?userId=1&limit=20&offset=0 — public read (markets are public data)
export async function GET(request: NextRequest) {
  await ensureSeeded();
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const limit = Math.min(Number(searchParams.get("limit")) || 20, 100);
    const offset = Number(searchParams.get("offset")) || 0;

    if (userId) {
      const rows = await db
        .select({
          prediction: predictions,
          marketTitle: markets.title,
          marketStatus: markets.status,
          winningOutcome: markets.winningOutcome,
        })
        .from(predictions)
        .innerJoin(markets, eq(predictions.marketId, markets.id))
        .where(eq(predictions.userId, Number(userId)))
        .orderBy(desc(predictions.createdAt))
        .limit(limit)
        .offset(offset);

      return NextResponse.json({ success: true, data: rows, count: rows.length, limit, offset });
    }

    const all = await db
      .select()
      .from(predictions)
      .orderBy(desc(predictions.createdAt))
      .limit(limit)
      .offset(offset);
    return NextResponse.json({ success: true, data: all, count: all.length, limit, offset });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/predictions — AUTH REQUIRED + ATOMIC TRANSACTION
export async function POST(request: NextRequest) {
  // NIST PROTECT: enforce authentication
  const guard = await requireUser(request);
  if (!guard.ok) return guard.response!;
  const authedUser = guard.user!;

  try {
    const body = await request.json();
    const { marketId, outcome, amount, currency, platform = "WEB" } = body;

    if (!marketId || !outcome || !amount || !currency) {
      return NextResponse.json(
        { success: false, error: "marketId, outcome, amount, and currency are required" },
        { status: 400 }
      );
    }

    if (!["YES", "NO"].includes(outcome)) {
      return NextResponse.json({ success: false, error: "outcome must be YES or NO" }, { status: 400 });
    }

    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      return NextResponse.json({ success: false, error: "amount must be a positive number" }, { status: 400 });
    }

    // Use authenticated user id — never trust userId from body (IDOR protection)
    const userId = authedUser.id;

    // --- Policy engine gate ------------------------------------------------
    const marketPre = (await db.select().from(markets).where(eq(markets.id, Number(marketId))))[0];
    const decision = evaluatePolicy({
      action: "prediction:place",
      subject: {
        userId,
        role: isRole(authedUser.role) ? authedUser.role : "MEMBER",
        status: authedUser.status,
        kycTier: authedUser.kycTier,
        countryCode: authedUser.countryCode,
        currency: authedUser.currency,
        balance: authedUser.balance,
      },
      resource: marketPre ? { type: "market", id: marketPre.id, status: marketPre.status } : undefined,
      amount: amt,
      channel: platform === "USSD" ? "USSD" : platform === "MOBILE" ? "MOBILE" : "WEB",
      ip: extractIp(request.headers),
    });

    await db.insert(policyAudit).values({
      userId,
      action: "prediction:place",
      effect: decision.effect,
      codes: decision.codes.join(",") || "NONE",
      reasons: decision.reasons.join(" | ").slice(0, 900),
      channel: platform,
      ip: extractIp(request.headers),
    }).catch(() => undefined);

    if (!decision.allowed) {
      logger.security("Prediction blocked by policy", {
        userId,
        metadata: { effect: decision.effect, codes: decision.codes },
      });
      return NextResponse.json(
        {
          success: false,
          error: decision.reasons.join(" "),
          policy: { effect: decision.effect, codes: decision.codes, obligations: decision.obligations },
        },
        { status: decision.effect === "REVIEW" ? 409 : 403 }
      );
    }

    // NIST PROTECT: atomic multi-step operation
    const result = await withTransaction(async () => {
      const marketList = await db.select().from(markets).where(eq(markets.id, Number(marketId)));
      const market = marketList[0];
      if (!market) throw new Error("Market not found");
      if (market.status !== "OPEN") throw new Error("Market is closed/resolved");

      // Re-read balance inside txn to prevent race conditions
      const userList = await db.select().from(users).where(eq(users.id, userId));
      const user = userList[0];
      if (!user) throw new Error("User not found");

      if (user.balance < amt) {
        throw new Error(`Insufficient balance. Need ${amt} ${currency}, have ${user.balance} ${currency}`);
      }

      const odd = outcome === "YES" ? market.oddsYes : market.oddsNo;
      const potentialPayout = Math.round(amt * odd);

      await db.update(users).set({ balance: user.balance - amt }).where(eq(users.id, userId));

      const newPrediction = await db
        .insert(predictions)
        .values({
          marketId: market.id,
          userId,
          outcome,
          amount: amt,
          potentialPayout,
          currency,
          platform,
        })
        .returning();

      let volumeIncrement = amt;
      if (currency === "UGX") volumeIncrement = Math.round(amt / 30);
      else if (currency === "TZS") volumeIncrement = Math.round(amt / 20);
      else if (currency === "RWF") volumeIncrement = Math.round(amt / 10);

      await db.update(markets).set({ volume: market.volume + volumeIncrement }).where(eq(markets.id, market.id));

      await db.insert(transactions).values({
        userId,
        type: "PREDICT_BUY",
        amount: amt,
        currency,
        provider: "WALLET",
        reference: generateRef(),
        phoneNumber: user.phoneNumber,
        status: "SUCCESS",
      });

      return {
        success: true,
        data: newPrediction[0],
        newBalance: user.balance - amt,
        potentialPayout,
      };
    });

    logger.log(LogLevel.INFO, "Prediction placed via API", { userId, metadata: { marketId, outcome, amount: amt } });
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    logger.log(LogLevel.ERROR, `Prediction failed: ${error.message}`, { userId: authedUser.id });
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
