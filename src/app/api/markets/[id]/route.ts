import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { markets, predictions, users, chamaPools, chamaMembers, transactions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireUser } from "@/lib/guard";
import { withTransaction } from "@/lib/transactions";
import { logger, LogLevel } from "@/lib/logger";

function generateRef(provider: string): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let prefix = "TX";
  if (provider === "M-PESA") prefix = "MP";
  if (provider === "MTN_MOMO") prefix = "MTN";
  if (provider === "AIRTEL_MONEY") prefix = "ART";
  
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}${code}`;
}

// GET /api/markets/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const result = await db.select().from(markets).where(eq(markets.id, Number(id)));
    if (!result[0]) {
      return NextResponse.json({ success: false, error: "Market not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: result[0] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH /api/markets/[id] - Resolve a market (with automatic payouts) — AUTH REQUIRED + ATOMIC
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireUser(request);
  if (!guard.ok) return guard.response!;
  const authedUser = guard.user!;

  const { id } = await params;
  try {
    const body = await request.json();
    const { winningOutcome } = body; // "YES" or "NO"

    if (!winningOutcome || !["YES", "NO"].includes(winningOutcome)) {
      return NextResponse.json({ success: false, error: "winningOutcome must be YES or NO" }, { status: 400 });
    }

    const marketId = Number(id);

    // ATOMIC: resolve market + distribute all payouts
    const result = await withTransaction(async () => {
      const marketList = await db.select().from(markets).where(eq(markets.id, marketId));
      const market = marketList[0];
      if (!market) throw new Error("Market not found");
      if (market.status !== "OPEN") throw new Error("Market is already resolved");

      await db.update(markets)
        .set({ status: "RESOLVED", winningOutcome })
        .where(eq(markets.id, marketId));

      const winningPredictions = await db.select()
        .from(predictions)
        .where(and(eq(predictions.marketId, marketId), eq(predictions.outcome, winningOutcome)));

      for (const pred of winningPredictions) {
        const predUserList = await db.select().from(users).where(eq(users.id, pred.userId));
        const predUser = predUserList[0];
        if (predUser) {
          await db.update(users)
            .set({ balance: predUser.balance + pred.potentialPayout })
            .where(eq(users.id, predUser.id));

          await db.insert(transactions).values({
            userId: predUser.id,
            type: "PREDICT_PAYOUT",
            amount: pred.potentialPayout,
            currency: pred.currency,
            provider: "WALLET",
            reference: generateRef("WALLET"),
            phoneNumber: predUser.phoneNumber,
            status: "SUCCESS",
          });
        }
      }

      const winningChamas = await db.select()
        .from(chamaPools)
        .where(and(eq(chamaPools.marketId, marketId), eq(chamaPools.targetOutcome, winningOutcome)));

      const odds = winningOutcome === "YES" ? market.oddsYes : market.oddsNo;

      for (const chama of winningChamas) {
        const members = await db.select().from(chamaMembers).where(eq(chamaMembers.chamaId, chama.id));
        for (const member of members) {
          const memberUserList = await db.select().from(users).where(eq(users.id, member.userId));
          const memberUser = memberUserList[0];
          if (memberUser) {
            const payoutAmount = Math.round(member.contribution * odds);

            await db.update(users)
              .set({ balance: memberUser.balance + payoutAmount })
              .where(eq(users.id, memberUser.id));

            await db.insert(transactions).values({
              userId: memberUser.id,
              type: "PREDICT_PAYOUT",
              amount: payoutAmount,
              currency: chama.currency,
              provider: "WALLET",
              reference: generateRef("WALLET") + "-CHAMA",
              phoneNumber: memberUser.phoneNumber,
              status: "SUCCESS",
            });
          }
        }
      }

      return {
        success: true,
        data: {
          market: { ...market, status: "RESOLVED", winningOutcome },
          winningPredictionsCount: winningPredictions.length,
          winningChamasCount: winningChamas.length,
        },
      };
    });

    logger.log(LogLevel.INFO, "Market resolved via API", {
      userId: authedUser.id,
      metadata: { marketId, winningOutcome, ...result.data },
    });
    return NextResponse.json(result);
  } catch (error: any) {
    logger.log(LogLevel.ERROR, `Market resolution failed: ${error.message}`, { userId: authedUser.id });
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
