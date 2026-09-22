import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { chamaPools, chamaMembers, users, transactions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireUser } from "@/lib/guard";
import { withTransaction } from "@/lib/transactions";
import { logger, LogLevel } from "@/lib/logger";

function generateRef(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "WL";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// POST /api/chamas/join — AUTH REQUIRED + ATOMIC
export async function POST(request: NextRequest) {
  const guard = await requireUser(request);
  if (!guard.ok) return guard.response!;
  const authedUser = guard.user!;

  try {
    const body = await request.json();
    const { code, contribution } = body;

    if (!code || !contribution) {
      return NextResponse.json(
        { success: false, error: "code and contribution are required" },
        { status: 400 }
      );
    }

    const amt = Number(contribution);
    if (!Number.isFinite(amt) || amt <= 0) {
      return NextResponse.json({ success: false, error: "contribution must be positive" }, { status: 400 });
    }

    const cleanCode = String(code).toUpperCase().replace(/\s+/g, "");
    const userId = authedUser.id; // IDOR protection

    const result = await withTransaction(async () => {
      const chamaList = await db.select().from(chamaPools).where(eq(chamaPools.code, cleanCode));
      const chama = chamaList[0];
      if (!chama) throw new Error("Chama with this code does not exist");

      // Prevent double-joining the same chama
      const existing = await db
        .select()
        .from(chamaMembers)
        .where(and(eq(chamaMembers.chamaId, chama.id), eq(chamaMembers.userId, userId)));
      if (existing.length > 0) throw new Error("You have already joined this Chama");

      const userList = await db.select().from(users).where(eq(users.id, userId));
      const user = userList[0];
      if (!user) throw new Error("User not found");
      if (user.balance < amt) {
        throw new Error(`Insufficient balance. Need ${amt} ${chama.currency}, have ${user.balance} ${chama.currency}`);
      }

      await db.update(users).set({ balance: user.balance - amt }).where(eq(users.id, userId));

      await db.insert(chamaMembers).values({ chamaId: chama.id, userId, contribution: amt });
      await db.update(chamaPools).set({ totalAmount: chama.totalAmount + amt }).where(eq(chamaPools.id, chama.id));

      await db.insert(transactions).values({
        userId,
        type: "PREDICT_BUY",
        amount: amt,
        currency: chama.currency,
        provider: "WALLET",
        reference: generateRef(),
        phoneNumber: user.phoneNumber,
        status: "SUCCESS",
      });

      return {
        success: true,
        data: {
          chama: { ...chama, totalAmount: chama.totalAmount + amt },
          newBalance: user.balance - amt,
          contribution: amt,
        },
      };
    });

    logger.log(LogLevel.INFO, "Joined chama via API", { userId, metadata: { code: cleanCode } });
    return NextResponse.json(result);
  } catch (error: any) {
    logger.log(LogLevel.ERROR, `Chama join failed: ${error.message}`, { userId: authedUser.id });
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
