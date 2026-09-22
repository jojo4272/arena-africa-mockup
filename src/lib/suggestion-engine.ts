/**
 * Prediction Suggestion Engine
 *
 * Autonomous system that discovers, curates, and recommends prediction markets
 * from freely available data sources across all domains.
 *
 * Features:
 * - Multi-source data aggregation (news, sports, crypto, weather, social)
 * - AI-powered relevance scoring and classification
 * - Duplicate detection and deduplication
 * - Human-in-the-loop review workflow
 * - Africa-specific localization and relevance
 * - Trending topic detection
 * - Automated initial probability estimation
 */

import { db } from "@/db";
import { marketSuggestions, dataSources, trendingTopics, markets } from "@/db/schema";
import { eq, and, desc, gte, sql } from "drizzle-orm";
import crypto from "crypto";

/**
 * Configuration for suggestion engine behavior
 */
export interface SuggestionEngineConfig {
  /** Minimum relevance score to create suggestion (0-100) */
  minRelevanceScore: number;

  /** Minimum trending score for auto-approval (0-100) */
  autoApproveThreshold: number;

  /** Maximum suggestions to generate per run */
  maxSuggestionsPerRun: number;

  /** Lookback window for duplicate detection (days) */
  duplicateDetectionDays: number;

  /** Enable Africa-specific filtering */
  enableAfricaFocus: boolean;

  /** Minimum similarity threshold for duplicate detection (0-1) */
  duplicateSimilarityThreshold: number;
}

export const DEFAULT_CONFIG: SuggestionEngineConfig = {
  minRelevanceScore: 60,
  autoApproveThreshold: 90,
  maxSuggestionsPerRun: 50,
  duplicateDetectionDays: 30,
  enableAfricaFocus: true,
  duplicateSimilarityThreshold: 0.85,
};

/**
 * Data source types and their characteristics
 */
export enum DataSourceType {
  NEWS_API = "NEWS_API",
  RSS_FEED = "RSS_FEED",
  SPORTS_API = "SPORTS_API",
  CRYPTO_API = "CRYPTO_API",
  WEATHER_API = "WEATHER_API",
  TWITTER_API = "TWITTER_API",
  REDDIT_API = "REDDIT_API",
  MANUAL = "MANUAL",
}

/**
 * Suggestion status in review workflow
 */
export enum SuggestionStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  PUBLISHED = "PUBLISHED",
  ARCHIVED = "ARCHIVED",
}

/**
 * Market suggestion with source metadata
 */
export interface MarketSuggestion {
  title: string;
  description: string;
  category: string;
  locale: string;
  suggestedEndsAt: Date;

  // Source
  sourceType: DataSourceType;
  sourceUrl?: string;
  sourceTitle?: string;
  sourcePublishedAt?: Date;

  // Scoring
  relevanceScore: number;
  trendingScore: number;
  viralityScore: number;
  localRelevanceScore: number;

  // Probability
  initialProbabilityYes: number;
  confidenceLevel: "LOW" | "MEDIUM" | "HIGH";

  // Metadata
  tags: string[];
  suggestedBy: string;
}

/**
 * Free data source definitions
 *
 * These are all freely available APIs/feeds with generous rate limits
 */
export const FREE_DATA_SOURCES = [
  // News APIs
  {
    name: "NewsAPI.org",
    type: DataSourceType.NEWS_API,
    url: "https://newsapi.org/v2/top-headlines",
    category: "politics",
    locale: "global",
    requiresKey: true,
    rateLimit: "100 requests/day (free tier)",
  },
  {
    name: "NewsData.io",
    type: DataSourceType.NEWS_API,
    url: "https://newsdata.io/api/1/news",
    category: "politics",
    locale: "global",
    requiresKey: true,
    rateLimit: "200 requests/day (free tier)",
  },

  // Sports APIs
  {
    name: "TheSportsDB",
    type: DataSourceType.SPORTS_API,
    url: "https://www.thesportsdb.com/api/v1/json/3/",
    category: "sports",
    locale: "global",
    requiresKey: false,
    rateLimit: "Unlimited (free)",
  },
  {
    name: "API-Football (RapidAPI)",
    type: DataSourceType.SPORTS_API,
    url: "https://api-football-v1.p.rapidapi.com/v3/",
    category: "sports",
    locale: "global",
    requiresKey: true,
    rateLimit: "100 requests/day (free tier)",
  },

  // Crypto APIs
  {
    name: "CoinGecko",
    type: DataSourceType.CRYPTO_API,
    url: "https://api.coingecko.com/api/v3/",
    category: "crypto",
    locale: "global",
    requiresKey: false,
    rateLimit: "50 calls/minute (free)",
  },
  {
    name: "CoinCap",
    type: DataSourceType.CRYPTO_API,
    url: "https://api.coincap.io/v2/",
    category: "crypto",
    locale: "global",
    requiresKey: false,
    rateLimit: "Unlimited (free)",
  },

  // Weather APIs
  {
    name: "OpenWeatherMap",
    type: DataSourceType.WEATHER_API,
    url: "https://api.openweathermap.org/data/2.5/",
    category: "climate",
    locale: "global",
    requiresKey: true,
    rateLimit: "1000 requests/day (free tier)",
  },
  {
    name: "WeatherAPI.com",
    type: DataSourceType.WEATHER_API,
    url: "https://api.weatherapi.com/v1/",
    category: "climate",
    locale: "global",
    requiresKey: true,
    rateLimit: "1M requests/month (free tier)",
  },

  // RSS Feeds (No API key needed)
  {
    name: "BBC Africa RSS",
    type: DataSourceType.RSS_FEED,
    url: "http://feeds.bbci.co.uk/news/world/africa/rss.xml",
    category: "politics",
    locale: "en",
    requiresKey: false,
    rateLimit: "Unlimited",
  },
  {
    name: "Al Jazeera Africa RSS",
    type: DataSourceType.RSS_FEED,
    url: "https://www.aljazeera.com/xml/rss/all.xml",
    category: "politics",
    locale: "en",
    requiresKey: false,
    rateLimit: "Unlimited",
  },
  {
    name: "Reuters Africa RSS",
    type: DataSourceType.RSS_FEED,
    url: "https://www.reuters.com/rssfeed/africaNews",
    category: "politics",
    locale: "en",
    requiresKey: false,
    rateLimit: "Unlimited",
  },

  // Social APIs
  {
    name: "Reddit (via Pushshift/API)",
    type: DataSourceType.REDDIT_API,
    url: "https://www.reddit.com/r/",
    category: "culture",
    locale: "global",
    requiresKey: false,
    rateLimit: "60 requests/minute (free)",
  },
];

/**
 * Calculate relevance score for a suggestion
 *
 * Factors:
 * - Recency (newer = higher)
 * - Source credibility
 * - Trending velocity
 * - Local relevance (Africa-specific)
 * - Category diversity
 */
export function calculateRelevanceScore(
  suggestion: Partial<MarketSuggestion>,
  config: SuggestionEngineConfig = DEFAULT_CONFIG
): number {
  let score = 0;

  // Recency score (0-30 points)
  if (suggestion.sourcePublishedAt) {
    const ageHours = (Date.now() - suggestion.sourcePublishedAt.getTime()) / (1000 * 60 * 60);
    if (ageHours < 24) score += 30;
    else if (ageHours < 72) score += 20;
    else if (ageHours < 168) score += 10;
  }

  // Trending score (0-25 points)
  score += (suggestion.trendingScore || 0) * 0.25;

  // Virality score (0-20 points)
  score += (suggestion.viralityScore || 0) * 0.20;

  // Local relevance (0-25 points) - Africa-specific boost
  if (config.enableAfricaFocus) {
    score += (suggestion.localRelevanceScore || 0) * 0.25;
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Generate a hash for duplicate detection
 *
 * Uses normalized title + category + timeframe
 */
export function generateDuplicateHash(title: string, category: string, endsAt: Date): string {
  const normalized = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const timeframe = endsAt.toISOString().split('T')[0]; // YYYY-MM-DD
  const combined = `${normalized}|${category}|${timeframe}`;

  return crypto.createHash('sha256').update(combined).digest('hex').substring(0, 16);
}

/**
 * Calculate similarity between two strings (0-1)
 *
 * Uses Jaccard similarity on word sets
 */
export function calculateSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));

  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

/**
 * Detect if a suggestion is a duplicate or too similar to existing markets
 */
export async function detectDuplicates(
  suggestion: MarketSuggestion,
  config: SuggestionEngineConfig = DEFAULT_CONFIG
): Promise<{
  isDuplicate: boolean;
  similarMarketIds: number[];
  duplicateHash: string;
}> {
  const duplicateHash = generateDuplicateHash(
    suggestion.title,
    suggestion.category,
    suggestion.suggestedEndsAt
  );

  // Check existing suggestions
  const existingSuggestions = await db
    .select()
    .from(marketSuggestions)
    .where(eq(marketSuggestions.duplicateCheckHash, duplicateHash));

  if (existingSuggestions.length > 0) {
    return {
      isDuplicate: true,
      similarMarketIds: [],
      duplicateHash,
    };
  }

  // Check existing markets
  const cutoffDate = new Date(Date.now() - config.duplicateDetectionDays * 24 * 60 * 60 * 1000);
  const existingMarkets = await db
    .select()
    .from(markets)
    .where(
      and(
        eq(markets.category, suggestion.category),
        gte(markets.createdAt, cutoffDate)
      )
    );

  const similarMarketIds: number[] = [];

  for (const market of existingMarkets) {
    const similarity = calculateSimilarity(suggestion.title, market.title);
    if (similarity >= config.duplicateSimilarityThreshold) {
      similarMarketIds.push(market.id);
    }
  }

  return {
    isDuplicate: similarMarketIds.length > 0,
    similarMarketIds,
    duplicateHash,
  };
}

/**
 * Estimate initial probability for a market based on source content
 *
 * Uses keyword analysis and sentiment indicators
 */
export function estimateInitialProbability(
  title: string,
  description: string,
  sourceType: DataSourceType
): {
  probability: number;
  confidence: "LOW" | "MEDIUM" | "HIGH";
} {
  // Default to 50% for balanced markets
  let probability = 0.50;
  let confidence: "LOW" | "MEDIUM" | "HIGH" = "LOW";

  const text = `${title} ${description}`.toLowerCase();

  // Strong positive indicators
  const positiveKeywords = [
    'will win', 'expected to', 'likely to', 'forecast to', 'predicted to',
    'favorite', 'leading', 'ahead', 'poll shows', 'survey finds',
  ];

  // Strong negative indicators
  const negativeKeywords = [
    'unlikely', 'won\'t', 'expected not', 'poll behind', 'trailing',
    'underdog', 'less likely', 'forecast against',
  ];

  // Count indicators
  let positiveCount = 0;
  let negativeCount = 0;

  for (const keyword of positiveKeywords) {
    if (text.includes(keyword)) {
      positiveCount++;
      probability += 0.05;
    }
  }

  for (const keyword of negativeKeywords) {
    if (text.includes(keyword)) {
      negativeCount++;
      probability -= 0.05;
    }
  }

  // Adjust confidence based on indicator strength
  if (positiveCount + negativeCount >= 3) {
    confidence = "HIGH";
  } else if (positiveCount + negativeCount >= 1) {
    confidence = "MEDIUM";
  }

  // Source-specific adjustments
  if (sourceType === DataSourceType.SPORTS_API) {
    // Sports APIs often have betting odds we could parse
    confidence = "MEDIUM";
  } else if (sourceType === DataSourceType.CRYPTO_API) {
    // Crypto is volatile, lower confidence
    confidence = "LOW";
  }

  // Clamp probability to reasonable bounds
  probability = Math.max(0.20, Math.min(0.80, probability));

  return { probability, confidence };
}

/**
 * Calculate Africa-specific relevance score
 *
 * Boosts content related to African countries, economies, sports teams, etc.
 */
export function calculateAfricaRelevance(title: string, description: string): number {
  const text = `${title} ${description}`.toLowerCase();

  let score = 0;

  // African countries (top 20 by population/relevance)
  const africanCountries = [
    'nigeria', 'ethiopia', 'egypt', 'congo', 'tanzania', 'kenya', 'uganda',
    'sudan', 'algeria', 'morocco', 'ghana', 'mozambique', 'madagascar',
    'cameroon', 'ivory coast', 'niger', 'burkina faso', 'mali', 'malawi',
    'zambia', 'somalia', 'senegal', 'chad', 'zimbabwe', 'rwanda',
  ];

  // African cities
  const africanCities = [
    'nairobi', 'lagos', 'cairo', 'johannesburg', 'kinshasa', 'luanda',
    'dar es salaam', 'khartoum', 'abidjan', 'alexandria', 'addis ababa',
    'cape town', 'casablanca', 'durban', 'kampala', 'accra',
  ];

  // African organizations/leagues
  const africanOrgs = [
    'afcon', 'african cup', 'caf', 'african union', 'ecowas', 'eac',
    'sadc', 'african', 'sub-saharan',
  ];

  // Score for country mentions
  for (const country of africanCountries) {
    if (text.includes(country)) score += 15;
  }

  // Score for city mentions
  for (const city of africanCities) {
    if (text.includes(city)) score += 10;
  }

  // Score for organization mentions
  for (const org of africanOrgs) {
    if (text.includes(org)) score += 20;
  }

  // General Africa mention
  if (text.includes('africa')) score += 10;

  return Math.min(100, score);
}

/**
 * Extract tags from suggestion content
 */
export function extractTags(title: string, description: string, category: string): string[] {
  const text = `${title} ${description}`.toLowerCase();
  const tags: Set<string> = new Set([category]);

  // Named entities (simple extraction)
  const words = text.split(/\s+/);

  // Countries
  const countries = ['kenya', 'nigeria', 'ghana', 'tanzania', 'uganda', 'ethiopia'];
  for (const country of countries) {
    if (text.includes(country)) tags.add(country);
  }

  // Sports
  const sports = ['football', 'soccer', 'cricket', 'rugby', 'basketball', 'athletics'];
  for (const sport of sports) {
    if (text.includes(sport)) tags.add(sport);
  }

  // Events
  const events = ['election', 'tournament', 'summit', 'conference', 'olympics'];
  for (const event of events) {
    if (text.includes(event)) tags.add(event);
  }

  // Crypto
  const cryptos = ['bitcoin', 'ethereum', 'crypto', 'blockchain'];
  for (const crypto of cryptos) {
    if (text.includes(crypto)) tags.add(crypto);
  }

  return Array.from(tags).slice(0, 10); // Max 10 tags
}

/**
 * Create a market suggestion
 */
export async function createSuggestion(
  suggestion: MarketSuggestion,
  config: SuggestionEngineConfig = DEFAULT_CONFIG
): Promise<{ success: boolean; suggestionId?: number; reason?: string }> {
  // Calculate relevance score
  const relevanceScore = calculateRelevanceScore(suggestion, config);

  if (relevanceScore < config.minRelevanceScore) {
    return {
      success: false,
      reason: `Relevance score ${relevanceScore.toFixed(1)} below threshold ${config.minRelevanceScore}`,
    };
  }

  // Check for duplicates
  const duplicateCheck = await detectDuplicates(suggestion, config);

  if (duplicateCheck.isDuplicate) {
    return {
      success: false,
      reason: `Duplicate or too similar to existing markets: ${duplicateCheck.similarMarketIds.join(', ')}`,
    };
  }

  // Estimate initial probability
  const { probability, confidence } = estimateInitialProbability(
    suggestion.title,
    suggestion.description,
    suggestion.sourceType
  );

  // Extract tags
  const tags = extractTags(suggestion.title, suggestion.description, suggestion.category);

  // Determine initial status
  let status = SuggestionStatus.PENDING;
  if (relevanceScore >= config.autoApproveThreshold) {
    status = SuggestionStatus.APPROVED;
  }

  // Insert suggestion
  const result = await db.insert(marketSuggestions).values({
    title: suggestion.title,
    description: suggestion.description,
    category: suggestion.category,
    locale: suggestion.locale,
    suggestedEndsAt: suggestion.suggestedEndsAt,

    sourceType: suggestion.sourceType,
    sourceUrl: suggestion.sourceUrl,
    sourceTitle: suggestion.sourceTitle,
    sourcePublishedAt: suggestion.sourcePublishedAt,

    relevanceScore,
    trendingScore: suggestion.trendingScore,
    viralityScore: suggestion.viralityScore,
    localRelevanceScore: suggestion.localRelevanceScore,

    initialProbabilityYes: probability,
    confidenceLevel: confidence,

    status,
    duplicateCheckHash: duplicateCheck.duplicateHash,
    similarMarketIds: duplicateCheck.similarMarketIds.join(','),

    tags: JSON.stringify(tags),
    suggestedBy: suggestion.suggestedBy,
  }).returning();

  return {
    success: true,
    suggestionId: result[0]?.id,
  };
}

/**
 * Get pending suggestions for review
 */
export async function getPendingSuggestions(limit: number = 50): Promise<any[]> {
  return await db
    .select()
    .from(marketSuggestions)
    .where(eq(marketSuggestions.status, SuggestionStatus.PENDING))
    .orderBy(desc(marketSuggestions.relevanceScore))
    .limit(limit);
}

/**
 * Get approved suggestions ready to publish
 */
export async function getApprovedSuggestions(limit: number = 20): Promise<any[]> {
  return await db
    .select()
    .from(marketSuggestions)
    .where(eq(marketSuggestions.status, SuggestionStatus.APPROVED))
    .orderBy(desc(marketSuggestions.relevanceScore))
    .limit(limit);
}

/**
 * Review and approve/reject a suggestion
 */
export async function reviewSuggestion(
  suggestionId: number,
  reviewerId: number,
  action: "APPROVE" | "REJECT",
  comment?: string
): Promise<{ success: boolean; message: string }> {
  const suggestions = await db
    .select()
    .from(marketSuggestions)
    .where(eq(marketSuggestions.id, suggestionId));

  if (suggestions.length === 0) {
    return { success: false, message: "Suggestion not found" };
  }

  const suggestion = suggestions[0];
  const newStatus = action === "APPROVE" ? SuggestionStatus.APPROVED : SuggestionStatus.REJECTED;

  // Update suggestion
  await db
    .update(marketSuggestions)
    .set({
      status: newStatus,
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      rejectionReason: action === "REJECT" ? comment : null,
      updatedAt: new Date(),
    })
    .where(eq(marketSuggestions.id, suggestionId));

  return {
    success: true,
    message: `Suggestion ${action === "APPROVE" ? "approved" : "rejected"}`,
  };
}

/**
 * Publish an approved suggestion as a live market
 */
export async function publishSuggestion(suggestionId: number): Promise<{
  success: boolean;
  marketId?: number;
  message: string;
}> {
  const suggestions = await db
    .select()
    .from(marketSuggestions)
    .where(eq(marketSuggestions.id, suggestionId));

  if (suggestions.length === 0) {
    return { success: false, message: "Suggestion not found" };
  }

  const suggestion = suggestions[0];

  if (suggestion.status !== SuggestionStatus.APPROVED) {
    return { success: false, message: "Suggestion must be approved first" };
  }

  // Create market from suggestion
  const result = await db.insert(markets).values({
    title: suggestion.title,
    description: suggestion.description || "",
    category: suggestion.category,
    locale: suggestion.locale,
    endsAt: suggestion.suggestedEndsAt,
    status: "OPEN",
    oddsYes: 1 / suggestion.initialProbabilityYes,
    oddsNo: 1 / (1 - suggestion.initialProbabilityYes),
    volume: 0,
    isFeatured: false,
  }).returning();

  const marketId = result[0]?.id;

  // Mark suggestion as published
  await db
    .update(marketSuggestions)
    .set({
      status: SuggestionStatus.PUBLISHED,
      updatedAt: new Date(),
    })
    .where(eq(marketSuggestions.id, suggestionId));

  return {
    success: true,
    marketId,
    message: `Market created with ID ${marketId}`,
  };
}
