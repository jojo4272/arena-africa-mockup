import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, transactions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/guard";
import { withTransaction } from "@/lib/transactions";
import { logger, LogLevel } from "@/lib/logger";
import {
  validateCard,
  tokenizeCard,
  issuerApproves,
  generateAuthorizationCode,
  maskCardNumber,
  type CardBrand,
} from "@/lib/cards";

/**
 * POST /api/cards/pay — Card deposit (Visa / Mastercard / Discover)
 * Body: { cardNumber, expiry, cvv, cardholderName, amount, currency }
 *
 * Process: BIN detect → Luhn → expiry/CVV → tokenize (no PAN stored)
 *          → issuer approval (demo) → atomic wallet credit + receipt.
 */
export async function POST(request: NextRequest) {
  const guard = await requireUser(request);
  if (!guard.ok) return guard.response!;
  const authedUser = guard.user!;

  try {
    const body = await request.json();
    const { cardNumber, expiry, cvv, cardholderName, amount, currency } = body;

    if (!cardNumber || !expiry || !cvv) {
      return NextResponse.json(
        { success: false, error: "cardNumber, expiry and cvv are required" },
        { status: 400 }
      );
    }

    const validation = validateCard(String(cardNumber), String(expiry), String(cvv));
    if (!validation.valid || validation.brand === "UNKNOWN") {
      logger.security("Card validation failed", {
        userId: authedUser.id,
        metadata: { brand: validation.brand, errors: validation.errors },
      });
      return NextResponse.json({ success: false, error: validation.errors.join(" ") }, { status: 400 });
    }

    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      return NextResponse.json({ success: false, error: "amount must be a positive number" }, { status: 400 });
    }

    const brand = validation.brand as CardBrand;
    const token = tokenizeCard(String(cardNumber));
    const approval = issuerApproves(String(cardNumber));
    const authCode = generateAuthorizationCode();

    if (!approval.approved) {
      logger.security("Card declined by simulator", { userId: authedUser.id, metadata: { brand, last4: token.last4 } });
      return NextResponse.json(
        { success: false, error: approval.message, code: approval.code },
        { status: 402 }
      );
    }

    const curr = currency || authedUser.currency;

    const result = await withTransaction(async () => {
      const userList = await db.select().from(users).where(eq(users.id, authedUser.id));
      const user = userList[0];
      if (!user) throw new Error("User not found");

      await db.update(users).set({ balance: user.balance + amt }).where(eq(users.id, authedUser.id));

      // Reference embeds brand + BIN prefix for auditability; PAN never stored.
      const reference = `${brand}-${token.bin}-${authCode}`;
      await db.insert(transactions).values({
        userId: authedUser.id,
        type: "DEPOSIT",
        amount: amt,
        currency: curr,
        provider: brand,
        reference,
        phoneNumber: user.phoneNumber,
        status: "SUCCESS",
      });

      return { reference, newBalance: user.balance + amt };
    });

    logger.log(LogLevel.INFO, `Card deposit via ${brand}`, {
      userId: authedUser.id,
      metadata: { amount: amt, currency: curr, last4: token.last4, masked: maskCardNumber(String(cardNumber)) },
    });

    return NextResponse.json({
      success: true,
      data: {
        brand,
        last4: token.last4,
        masked: maskCardNumber(String(cardNumber)),
        cardToken: token.token,
        authCode,
        reference: result.reference,
        newBalance: result.newBalance,
        amount: amt,
        currency: curr,
        issuerMessage: approval.message,
      },
    });
  } catch (error: any) {
    logger.log(LogLevel.ERROR, `Card payment failed: ${error.message}`, { userId: authedUser.id });
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
