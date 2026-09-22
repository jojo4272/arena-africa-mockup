import { NextRequest, NextResponse } from "next/server";
import { ensureSeeded } from "@/db/seed";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

// GET /api/users/[id] - Get single user
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureSeeded();
  const { id } = await params;
  try {
    const result = await db.select().from(users).where(eq(users.id, Number(id)));
    if (!result[0]) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: result[0] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
