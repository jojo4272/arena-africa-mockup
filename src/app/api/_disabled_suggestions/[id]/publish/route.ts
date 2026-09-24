import { NextResponse } from 'next/server';
import { db } from '@/db';
import { marketSuggestions, markets, suggestionReviews } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireUser } from '@/lib/guard';
import { z } from 'zod';

// POST /api/suggestions/[id]/publish - Create a live market from an approved suggestion
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireUser();

    // Check if user is moderator or admin
    const userRole = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, user.id),
      columns: { role: true },
    });

    if (!userRole || !(userRole.role === 'MODERATOR' || userRole.role === 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const suggestionId = parseInt(id);
    if (isNaN(suggestionId)) {
      return NextResponse.json(
        { error: 'Invalid suggestion ID' },
        { status: 400 }
      );
    }

    // Fetch the suggestion
    const suggestion = await db.query.marketSuggestions.findFirst({
      where: (suggestions, { eq }) => eq(suggestions.id, suggestionId),
    });

    if (!suggestion) {
      return NextResponse.json(
        { error: 'Suggestion not found' },
        { status: 404 }
      );
    }

    // Check if suggestion is approved
    if (suggestion.status !== 'APPROVED') {
      return NextResponse.json(
        { error: `Suggestion is not approved (current status: ${suggestion.status})` },
        { status: 400 }
      );
    }

    // Validate dates
    const now = new Date();
    const startsAt = suggestion.suggestedStartsAt ?? now;
    const endsAt = suggestion.suggestedEndsAt;

    if (endsAt && endsAt <= startsAt) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Create market from suggestion
    const [market] = await db
      .insert(markets)
      .values({
        title: suggestion.title,
        description: suggestion.description,
        category: suggestion.category,
        locale: suggestion.locale,
        volume: 0, // Start with zero volume
        totalLiquidity: 0, // Start with zero liquidity
        startsAt,
        endsAt,
        resolution: null, // To be resolved later
        resolutionSource: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: user.id,
      })
      .returning();

    // Update suggestion status to PUBLISHED and link to market
    const [updatedSuggestion] = await db
      .update(marketSuggestions)
      .set({
        status: 'PUBLISHED',
        marketId: market.id,
        publishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(marketSuggestions.id, suggestionId))
      .returning();

    // Log the publish action
    await db.insert(suggestionReviews).values({
      suggestionId: suggestionId,
      reviewerId: user.id,
      action: 'PUBLISHED',
      comments: `Market created with ID ${market.id}`,
      createdAt: new Date(),
    });

    return NextResponse.json({
      suggestion: updatedSuggestion,
      market,
    });
  } catch (error) {
    console.error('Error publishing suggestion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}