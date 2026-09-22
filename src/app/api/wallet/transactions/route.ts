import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

// GET /api/wallet/transactions?userId=1
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (userId) {
      const results = await db.select()
        .from(transactions)
        .where(eq(transactions.userId, Number(userId)))
        .orderBy(desc(transactions.createdAt))
        .limit(50);
      return NextResponse.json({ success: true, data: results, count: results.length });
    }

    const all = await db.select()
      .from(transactions)
      .orderBy(desc(transactions.createdAt))
      .limit(50);
    return NextResponse.json({ success: true, data: all, count: all.length });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
