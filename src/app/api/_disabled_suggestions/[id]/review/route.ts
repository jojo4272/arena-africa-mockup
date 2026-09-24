import { NextResponse } from 'next/server';
import { db } from '@/db';
import { marketSuggestions, suggestionReviews } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireUser } from '@/lib/guard';
import { z } from 'zod';

// POST /api/suggestions/[id]/review - Approve or reject a suggestion
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

    const body = await request.json();
    const reviewSchema = z.object({
      action: z.enum(['APPROVE', 'REJECT']),
      comments: z.string().optional(),
    });

    const { action, comments } = reviewSchema.parse(body);

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

    // Check if suggestion is still pending
    if (suggestion.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Suggestion is already ${suggestion.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    // Update suggestion status
    const [updatedSuggestion] = await db
      .update(marketSuggestions)
      .set({
        status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
        reviewedAt: new Date(),
        reviewedBy: user.id,
        reviewComments: comments,
        updatedAt: new Date(),
      })
      .where(eq(marketSuggestions.id, suggestionId))
      .returning();

    // Log the review action
    await db.insert(suggestionReviews).values({
      suggestionId: suggestionId,
      reviewerId: user.id,
      action: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
      comments: comments,
      createdAt: new Date(),
    });

    return NextResponse.json(updatedSuggestion);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error reviewing suggestion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}