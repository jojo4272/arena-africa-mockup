import { NextResponse } from 'next/server';
import { db } from '@/db';
import { trendingTopics } from '@/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { requireUser } from '@/lib/guard';

// GET /api/suggestions/trending - View emerging topics
export async function GET(request: Request) {
  try {
    const user = await requireUser();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const category = searchParams.get('category');
    const locale = searchParams.get('locale');
    const hours = parseInt(searchParams.get('hours') || '24'); // Last N hours

    // Build where clause
    const whereConditions = [];

    if (category) {
      whereConditions.push(eq(trendingTopics.category, category));
    }
    if (locale) {
      whereConditions.push(eq(trendingTopics.locale, locale));
    }
    if (hours > 0) {
      const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
      whereConditions.push(sql`${trendingTopics.updatedAt} >= ${cutoffTime}`);
    }

    const trending = await db
      .select({
        id: trendingTopics.id,
        topic: trendingTopics.topic,
        category: trendingTopics.category,
        locale: trendingTopics.locale,
        mentionCount: trendingTopics.mentionCount,
        velocityScore: trendingTopics.velocityScore,
        relevanceScore: trendingTopics.relevanceScore,
        firstSeenAt: trendingTopics.firstSeenAt,
        lastSeenAt: trendingTopics.lastSeenAt,
        updatedAt: trendingTopics.updatedAt,
        sourceUrls: trendingTopics.sourceUrls,
      })
      .from(trendingTopics)
      .where(and(...whereConditions))
      .orderBy(desc(trendingTopics.velocityScore), desc(trendingTopics.mentionCount))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: sql`count(*)` })
      .from(trendingTopics)
      .where(and(...whereConditions));

    return NextResponse.json({
      trending,
      pagination: {
        limit,
        offset,
        total: Number(count),
        hasMore: offset + limit < Number(count),
      },
    });
  } catch (error) {
    console.error('Error fetching trending topics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}