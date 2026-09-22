import { NextRequest, NextResponse } from "next/server";
import { ensureSeeded } from "@/db/seed";
import { db } from "@/db";
import { chamaPools, chamaMembers, markets, users, transactions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireUser } from "@/lib/guard";
import { withTransaction } from "@/lib/transactions";
import { logger, LogLevel } from "@/lib/logger";

export const dynamic = "force-dynamic";

function generateRef(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "WL";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// GET /api/chamas — public read
export async function GET(request: NextRequest) {
  await ensureSeeded();
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit")) || 20, 100);
    const offset = Number(searchParams.get("offset")) || 0;

    const rows = await db
      .select({ chama: chamaPools, marketTitle: markets.title })
      .from(chamaPools)
      .innerJoin(markets, eq(chamaPools.marketId, markets.id))
      .orderBy(desc(chamaPools.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ success: true, data: rows, count: rows.length, limit, offset });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/chamas — AUTH REQUIRED + ATOMIC
export async function POST(request: NextRequest) {
  const guard = await requireUser(request);
  if (!guard.ok) return guard.response!;
  const authedUser = guard.user!;

  try {
    const body = await request.json();
    const { name, marketId, code, targetOutcome, contribution, currency } = body;

    if (!name || !marketId || !code || !targetOutcome || !contribution) {
      return NextResponse.json(
        { success: false, error: "name, marketId, code, targetOutcome, contribution are required" },
        { status: 400 }
      );
    }

    const amt = Number(contribution);
    if (!Number.isFinite(amt) || amt <= 0) {
      return NextResponse.json({ success: false, error: "contribution must be positive" }, { status: 400 });
    }

    const userId = authedUser.id; // IDOR protection
    const curr = currency || authedUser.currency;

    const result = await withTransaction(async () => {
      const userList = await db.select().from(users).where(eq(users.id, userId));
      const user = userList[0];
      if (!user) throw new Error("User not found");
      if (user.balance < amt) throw new Error(`Insufficient balance. Need ${amt} ${curr}`);

      await db.update(users).set({ balance: user.balance - amt }).where(eq(users.id, userId));

      const newChama = await db
        .insert(chamaPools)
        .values({
          name,
          marketId: Number(marketId),
          code: String(code).toUpperCase().replace(/\s+/g, ""),
          targetOutcome,
          totalAmount: amt,
          currency: curr,
        })
        .returning();

      await db.insert(chamaMembers).values({ chamaId: newChama[0].id, userId, contribution: amt });

      await db.insert(transactions).values({
        userId,
        type: "PREDICT_BUY",
        amount: amt,
        currency: curr,
        provider: "WALLET",
        reference: generateRef(),
        phoneNumber: user.phoneNumber,
        status: "SUCCESS",
      });

      return { success: true, data: newChama[0], newBalance: user.balance - amt };
    });

    logger.log(LogLevel.INFO, "Chama created via API", { userId, metadata: { name } });
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    logger.log(LogLevel.ERROR, `Chama creation failed: ${error.message}`, { userId: authedUser.id });
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
