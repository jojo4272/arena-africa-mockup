import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, transactions } from "@/db/schema";
import { eq } from "drizzle-orm";
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

// POST /api/wallet/withdraw — AUTH REQUIRED + ATOMIC
export async function POST(request: NextRequest) {
  const guard = await requireUser(request);
  if (!guard.ok) return guard.response!;
  const authedUser = guard.user!;

  try {
    const body = await request.json();
    const { amount, currency, provider, phoneNumber } = body;

    if (!amount || !currency || !provider || !phoneNumber) {
      return NextResponse.json(
        { success: false, error: "amount, currency, provider, and phoneNumber are required" },
        { status: 400 }
      );
    }

    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      return NextResponse.json({ success: false, error: "amount must be a positive number" }, { status: 400 });
    }

    const userId = authedUser.id; // IDOR protection

    const result = await withTransaction(async () => {
      const userList = await db.select().from(users).where(eq(users.id, userId));
      const user = userList[0];
      if (!user) throw new Error("User not found");

      if (user.balance < amt) {
        throw new Error(`Insufficient balance. Have ${user.balance} ${currency}`);
      }

      const ref = generateRef(provider);

      await db.update(users).set({ balance: user.balance - amt }).where(eq(users.id, userId));

      await db.insert(transactions).values({
        userId,
        type: "WITHDRAWAL",
        amount: amt,
        currency,
        provider,
        reference: ref,
        phoneNumber,
        status: "SUCCESS",
      });

      return {
        success: true,
        data: { reference: ref, newBalance: user.balance - amt, amount: amt, currency, provider },
      };
    });

    logger.log(LogLevel.INFO, "Withdrawal via API", { userId, metadata: { amount: amt, provider } });
    return NextResponse.json(result);
  } catch (error: any) {
    logger.log(LogLevel.ERROR, `Withdrawal failed: ${error.message}`, { userId: authedUser.id });
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
