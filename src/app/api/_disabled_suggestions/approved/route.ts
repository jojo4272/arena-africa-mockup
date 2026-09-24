import { NextResponse } from 'next/server';
import { db } from '@/db';
import { marketSuggestions } from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { requireUser } from '@/lib/guard';

// GET /api/suggestions/approved - Fetch approved suggestions ready for publication
export async function GET(request: Request) {
  try {
    const user = await requireUser();

    // Check if user is moderator or admin
    const userRole = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, user.id),
      columns: { role: true },
    });

    if (!userRole || !(userRole.role === 'MODERATOR' || userRole.role === 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const category = searchParams.get('category');
    const locale = searchParams.get('locale');

    // Build where clause
    const whereConditions = [eq(marketSuggestions.status, 'APPROVED')];

    if (category) {
      whereConditions.push(eq(marketSuggestions.category, category));
    }
    if (locale) {
      whereConditions.push(eq(marketSuggestions.locale, locale));
    }

    const suggestions = await db
      .select({
        id: marketSuggestions.id,
        title: marketSuggestions.title,
        description: marketSuggestions.description,
        category: marketSuggestions.category,
        locale: marketSuggestions.locale,
        suggestedStartsAt: marketSuggestions.suggestedStartsAt,
        suggestedEndsAt: marketSuggestions.suggestedEndsAt,
        initialProbability: marketSuggestions.initialProbability,
        relevanceScore: marketSuggestions.relevanceScore,
        sourceType: marketSuggestions.sourceType,
        sourceTitle: marketSuggestions.sourceTitle,
        sourceUrl: marketSuggestions.sourceUrl,
        sourcePublishedAt: marketSuggestions.sourcePublishedAt,
        duplicateHash: marketSuggestions.duplicateHash,
        createdAt: marketSuggestions.createdAt,
        reviewedAt: marketSuggestions.reviewedAt,
        reviewedBy: marketSuggestions.reviewedBy,
        reviewComments: marketSuggestions.reviewComments,
      })
      .from(marketSuggestions)
      .where(and(...whereConditions))
      .orderBy(desc(marketSuggestions.reviewedAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: sql`count(*)` })
      .from(marketSuggestions)
      .where(and(...whereConditions));

    return NextResponse.json({
      suggestions,
      pagination: {
        limit,
        offset,
        total: Number(count),
        hasMore: offset + limit < Number(count),
      },
    });
  } catch (error) {
    console.error('Error fetching approved suggestions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}