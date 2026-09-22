import { NextRequest, NextResponse } from "next/server";
import { ensureSeeded } from "@/db/seed";
import { db } from "@/db";
import { markets } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { requireUser } from "@/lib/guard";
import { logger, LogLevel } from "@/lib/logger";

// GET /api/markets?locale=en&category=sports&status=OPEN
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  await ensureSeeded();
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get("locale");
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const featured = searchParams.get("featured");

    const conditions = [];
    if (locale && locale !== "all") conditions.push(eq(markets.locale, locale));
    if (category && category !== "all") conditions.push(eq(markets.category, category));
    if (status) conditions.push(eq(markets.status, status));
    if (featured === "true") conditions.push(eq(markets.isFeatured, true));

    const results = conditions.length > 0
      ? await db.select().from(markets).where(and(...conditions)).orderBy(desc(markets.createdAt))
      : await db.select().from(markets).orderBy(desc(markets.createdAt));

    return NextResponse.json({ success: true, data: results, count: results.length });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/markets — AUTH REQUIRED
export async function POST(request: NextRequest) {
  const guard = await requireUser(request);
  if (!guard.ok) return guard.response!;
  const authedUser = guard.user!;

  try {
    const body = await request.json();
    const { title, description, category, locale = "en", endsAt, oddsYes = 1.85, oddsNo = 1.85, isFeatured = false } = body;

    if (!title || !endsAt) {
      return NextResponse.json({ success: false, error: "title and endsAt are required" }, { status: 400 });
    }

    const newMarket = await db.insert(markets).values({
      title: String(title),
      description: description || "",
      category: category || "culture",
      locale,
      endsAt: new Date(endsAt),
      oddsYes: Number(oddsYes),
      oddsNo: Number(oddsNo),
      volume: 0,
      status: "OPEN",
      isFeatured: !!isFeatured,
    }).returning();

    logger.log(LogLevel.INFO, "Market created via API", { userId: authedUser.id, metadata: { title } });
    return NextResponse.json({ success: true, data: newMarket[0] }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
