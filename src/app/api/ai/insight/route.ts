import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { markets } from "@/db/schema";
import { eq } from "drizzle-orm";
import { marketInsight, geminiConfigured } from "@/lib/gemini";

export const dynamic = "force-dynamic";

/**
 * GET /api/ai/insight?marketId=1
 * Neutral, non-advisory briefing on a market. Public read — market
 * discovery is open, so insight follows the same access level.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const marketId = Number(searchParams.get("marketId"));
    if (!marketId) {
      return NextResponse.json({ success: false, error: "marketId is required" }, { status: 400 });
    }

    const rows = await db.select().from(markets).where(eq(markets.id, marketId));
    const market = rows[0];
    if (!market) {
      return NextResponse.json({ success: false, error: "Market not found" }, { status: 404 });
    }

    const result = await marketInsight({
      title: market.title,
      description: market.description,
      oddsYes: market.oddsYes,
      oddsNo: market.oddsNo,
      category: market.category,
    });

    return NextResponse.json({
      success: true,
      data: {
        marketId,
        title: market.title,
        insight: result.data,
        aiSource: result.source,
        geminiConfigured: geminiConfigured(),
        disclaimer: "Informational only. Not financial advice.",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
