import { NextResponse } from 'next/server';
import { db } from '@/db';
import { marketSuggestions, dataSources } from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { requireUser } from '@/lib/guard';
import { z } from 'zod';

// GET /api/suggestions/pending - Fetch pending suggestions for review
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
    const whereConditions = [eq(marketSuggestions.status, 'PENDING')];

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
      })
      .from(marketSuggestions)
      .where(and(...whereConditions))
      .orderBy(desc(marketSuggestions.createdAt))
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
    console.error('Error fetching pending suggestions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/suggestions - Create a new suggestion (manual submission)
export async function POST(request: Request) {
  try {
    const user = await requireUser();

    const body = await request.json();
    const suggestionSchema = z.object({
      title: z.string().min(1),
      description: z.string().min(1),
      category: z.enum([
        'politics', 'sports', 'crypto', 'climate', 'entertainment',
        'technology', 'business', 'health', 'other'
      ]),
      locale: z.enum(['en', 'sw', 'fr', 'pt']).default('en'),
      suggestedStartsAt: z.preprocess(
        (arg) => (typeof arg === 'string' || arg instanceof Date ? new Date(arg) : undefined),
        z.date()
      ),
      suggestedEndsAt: z.preprocess(
        (arg) => (typeof arg === 'string' || arg instanceof Date ? new Date(arg) : undefined),
        z.date()
      ),
      initialProbability: z.number().min(0).max(1).optional(),
      sourceType: z.enum(['MANUAL', 'RSS_FEED', 'CRYPTO_API', 'SPORTS_API', 'WEATHER_API']).default('MANUAL'),
      sourceTitle: z.string().optional(),
      sourceUrl: z.string().url().optional(),
    });

    const parsedBody = suggestionSchema.parse(body);

    // Generate duplicate hash
    const crypto = await import('crypto');
    const hash = crypto.createHash('sha256')
      .update(parsedBody.title.toLowerCase().trim())
      .update(parsedBody.description.toLowerCase().trim())
      .digest('hex');

    // Check for duplicates
    const existing = await db.query.marketSuggestions.findFirst({
      where: (suggestions, { eq }) => eq(suggestions.duplicateHash, hash),
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Duplicate suggestion detected', suggestionId: existing.id },
        { status: 409 }
      );
    }

    // Create suggestion
    const [suggestion] = await db
      .insert(marketSuggestions)
      .values({
        ...parsedBody,
        duplicateHash: hash,
        sourcePublishedAt: parsedBody.sourceUrl ? new Date() : undefined,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Log to suggestionReviews for audit
    await db.insert(suggestionReviews).values({
      suggestionId: suggestion.id,
      reviewerId: user.id,
      action: 'SUBMITTED',
      comments: 'User submitted suggestion',
      createdAt: new Date(),
    });

    return NextResponse.json(suggestion, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating suggestion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}