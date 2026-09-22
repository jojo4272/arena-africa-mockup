import { NextResponse } from 'next/server';
import { db } from '@/db';
import { marketSuggestions, suggestionReviews, dataSources, trendingTopics } from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { requireUser } from '@/lib/guard';
import { z } from 'zod';

// Test endpoint to verify suggestion engine API is working
export async function GET(request: Request) {
  try {
    // Test database connection
    const testResult = await db.select({ test: sql`'connection successful'` }).from(marketSuggestions).limit(1);

    // Count suggestions by status
    const statusCounts = await db
      .select({
        status: marketSuggestions.status,
        count: sql`count(*)`
      })
      .from(marketSuggestions)
      .groupBy(marketSuggestions.status);

    // Count data sources
    const dataSourceCount = await db
      .select({ count: sql`count(*)` })
      .from(dataSources);

    // Count trending topics
    const trendingCount = await db
      .select({ count: sql`count(*)` })
      .from(trendingTopics);

    return NextResponse.json({
      success: true,
      message: 'Suggestion engine API is working',
      database: testResult[0],
      suggestionCounts: statusCounts,
      dataSources: dataSourceCount[0].count,
      trendingTopics: trendingCount[0].count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('API test error:', error);
    return NextResponse.json(
      { error: 'Database connection failed', details: error.message },
      { status: 500 }
    );
  }
}