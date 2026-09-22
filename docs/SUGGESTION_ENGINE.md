# Arena Africa Suggestion Engine

## Overview

The Arena Africa Suggestion Engine is an autonomous system that discovers, curates, and recommends prediction markets from freely available data sources across all domains. It implements a human-in-the-loop review workflow where suggestions are generated automatically but require moderator approval before being presented to users.

## Features

- **Multi-source data aggregation**: Connects to news, sports, crypto, weather, and social APIs
- **AI-powered relevance scoring**: Scores suggestions based on recency, trending velocity, virality, and local relevance
- **Duplicate detection**: Uses cryptographic hashing and similarity algorithms to prevent duplicate markets
- **Human-in-the-loop review workflow**: PENDING → APPROVED/REJECTED → PUBLISHED
- **Africa-specific localization**: Boosts relevance for Africa-related content
- **Trending topic detection**: Tracks emerging topics and their velocity
- **Automated initial probability estimation**: Estimates YES/NO probabilities from source content

## Architecture

### Data Flow

1. **Data Fetching**: Periodically fetches data from configured sources
2. **Suggestion Generation**: Converts raw data into MarketSuggestion objects
3. **Scoring & Deduplication**: Calculates relevance scores and checks for duplicates
4. **Storage**: Stores suggestions in the database with PENDING status
5. **Review Workflow**: Moderators review and approve/reject suggestions
6. **Publication**: Approved suggestions are converted to live markets

### Components

#### 1. Data Source Integrators (`src/lib/suggestion-fetchers.ts`)
- **RSSFeedFetcher**: Parses BBC Africa, Al Jazeera, Reuters RSS feeds
- **CryptoAPIFetcher**: Uses CoinGecko to find trending cryptocurrencies
- **SportsAPIFetcher**: Uses TheSportsDB (free API) for upcoming sports events
- **WeatherAPIFetcher**: Uses OpenWeatherMap for weather-based predictions

#### 2. Suggestion Engine (`src/lib/suggestion-engine.ts`)
- **calculateRelevanceScore()**: Multi-factor scoring algorithm
- **generateDuplicateHash()**: Creates SHA-256 hash for duplicate detection
- **estimateInitialProbability()**: Estimates YES/NO probability from content
- **createSuggestion()**: Main entry point that scores, deduplicates, and stores
- **getPendingSuggestions()**, **reviewSuggestion()**, **publishSuggestion()**: Workflow functions

#### 3. Data Source Manager (`src/lib/data-sources.ts`)
- Manages configuration and scheduling of data sources
- Provides `runDataSources()` to execute all active sources
- Includes `scheduleDataSourceFetch()` for periodic execution

#### 4. API Routes (`src/app/api/suggestions/`)
- **GET /api/suggestions/pending**: Fetch suggestions for moderator review
- **POST /api/suggestions/[id]/review**: Approve or reject suggestions
- **GET /api/suggestions/approved**: Fetch approved suggestions
- **POST /api/suggestions/[id]/publish**: Create live market from approved suggestion
- **GET /api/suggestions/trending**: View emerging topics
- **POST /api/suggestions/fetch**: Trigger manual data source fetch

#### 5. Database Schema (`src/db/schema.ts`)
- **marketSuggestions**: Stores all suggestions with scoring and metadata
- **suggestionReviews**: Audit trail of review actions
- **dataSources**: Configuration for external data sources
- **trendingTopics**: Tracks emerging topics and metrics

## Installation & Setup

### 1. Database Migration
Run the following to apply the necessary schema changes:
```bash
npx drizzle-kit push --config=drizzle.config.json
```

### 2. Environment Variables
No additional environment variables are required for the core suggestion engine. However, for full functionality:
- OpenWeatherMap API key (for weather fetcher) - optional
- NewsAPI.org key (for news fetcher) - optional

### 3. Starting the Scheduler
The suggestion engine scheduler is automatically started via `src/app/suggestion-scheduler.ts` which imports and starts the scheduler on app initialization.

To manually start:
```typescript
import { startSuggestionScheduler } from '@/lib/suggestion-scheduler';
startSuggestionScheduler(60); // Run every 60 minutes
```

## Usage Examples

### Fetching Pending Suggestions (Moderator View)
```bash
GET /api/suggestions/pending?limit=20&offset=0&category=politics&locale=en
```

### Reviewing a Suggestion
```bash
POST /api/suggestions/123/review
{
  "action": "APPROVE",
  "comments": "Good suggestion, relevant to upcoming Kenyan elections"
}
```

### Publishing an Approved Suggestion
```bash
POST /api/suggestions/123/publish
```

### Manual Data Fetch Trigger
```bash
POST /api/suggestions/fetch
```

## Scoring Algorithm

The relevance score (0-100) is calculated as follows:

1. **Recency (0-30 points)**:
   - <24 hours: 30 points
   - <72 hours: 20 points
   - <168 hours (1 week): 10 points
   - >1 week: 0 points

2. **Trending Score (0-25 points)**:
   - Based on source-provided trending score (0-100) × 0.25

3. **Virality Score (0-20 points)**:
   - Based on source-provided virality score (0-100) × 0.20

4. **Local Relevance (0-25 points)**:
   - Africa-specific relevance score (0-100) × 0.25
   - Only applied if `enableAfricaFocus` is true

### Africa Relevance Boost
- African country mention: +15 points each
- African city mention: +10 points each
- African organization mention: +20 points each
- General "Africa" mention: +10 points
- Maximum: 100 points

## Duplicate Detection

Uses a two-phase approach:
1. **Exact Duplicate Check**: SHA-256 hash of normalized title + category + date
2. **Similarity Check**: Jaccard similarity on title words against existing markets
   - Threshold: 0.85 (85% similarity)
   - Lookback window: Configurable (default 30 days)

## Review Workflow

1. **PENDING**: Initial state after creation
2. **APPROVED**: Moderator has approved, ready for publication
3. **REJECTED**: Moderator has rejected with optional comments
4. **PUBLISHED**: Approved suggestion has been converted to live market
5. **ARCHIVED**: Old suggestions that are no longer relevant

## Performance Considerations

- **Rate Limiting**: Each fetcher implements respect for API rate limits
- **Caching**: Consider adding caching layer for external API responses
- **Batch Processing**: Suggestions are processed in batches to avoid memory issues
- **Database Indexes**: Proper indexes added for status, dates, and lookup fields

## Extending the Engine

### Adding New Data Sources
1. Create a new class implementing `DataFetcher` interface
2. Add fetcher type to `DataSourceType` enum
3. Update `createDefaultOrchestrator()` to conditionally include the fetcher
4. Add to `FREE_DATA_SOURCES` array in suggestion-engine.ts for documentation

### Customizing Scoring
Modify `calculateRelevanceScore()` in suggestion-engine.ts to adjust weights or add factors.

### Changing Auto-Approval Threshold
Adjust `autoApproveThreshold` in `DEFAULT_CONFIG` or pass custom config to functions.

## Security Considerations

- **Input Validation**: All API endpoints validate inputs using Zod schemas
- **Authorization**: Moderator/admin role required for all suggestion engine endpoints
- **SQL Injection**: Uses Drizzle ORM parameterized queries
- **Rate Limiting**: External API calls respect provider rate limits
- **Data Sanitization**: HTML stripping and entity decoding in RSS parser

## Monitoring & Maintenance

### Health Check
Use `/api/suggestions/test` endpoint to verify:
- Database connectivity
- Table accessibility
- Basic query functionality

### Metrics Tracked
- Suggestions generated per source per run
- Approval/rejection rates
- Average time from suggestion to publication
- Duplicate detection rate
- Africa relevance score distribution

### Troubleshooting
- **No suggestions generated**: Check data source configurations and API keys
- **High duplicate rate**: Adjust duplicate similarity threshold or detection window
- **Low approval rate**: Review relevance score thresholds and scoring algorithm
- **Scheduler not running**: Check server logs for startup errors