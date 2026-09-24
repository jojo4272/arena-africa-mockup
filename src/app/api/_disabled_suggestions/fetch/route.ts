import { NextResponse } from 'next/server';
import { runDataSources } from '@/lib/data-sources';
import { requireUser } from '@/lib/guard';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

// POST /api/suggestions/fetch - Trigger data source fetch (for cron/admin)
export async function POST(request: Request) {
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

    // Run the data source fetch
    const suggestionsCount = await runDataSources();

    return NextResponse.json({
      success: true,
      suggestionsGenerated: suggestionsCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error triggering data source fetch:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/suggestions/fetch - Get last fetch status
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

    // Fetch last run stats from dataSources table
    const dataSources = await db
      .select({
        name: dataSources.name,
        type: dataSources.type,
        lastFetchAt: dataSources.lastFetchAt,
        lastSuccessAt: dataSources.lastSuccessAt,
        lastError: dataSources.lastError,
        totalFetches: dataSources.totalFetches,
        totalSuggestions: dataSources.totalSuggestions,
      })
      .from(dataSources)
      .orderBy(desc(dataSources.lastFetchAt));

    return NextResponse.json({ dataSources });
  } catch (error) {
    console.error('Error fetching data source status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}