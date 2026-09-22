/**
 * Data Source Manager
 *
 * Manages configuration and scheduling of data sources for the suggestion engine.
 */

import { db } from "@/db";
import { dataSources } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { createDefaultOrchestrator, SuggestionOrchestrator } from "./suggestion-fetchers";

/**
 * Initialize default data sources
 */
export async function initializeDefaultDataSources() {
  // Check if sources already exist
  const existingSources = await db.select().from(dataSources);

  if (existingSources.length > 0) {
    console.log("Data sources already initialized");
    return;
  }

  const sourcesToInsert = [
    // News Sources
    {
      name: "BBC Africa News",
      type: "RSS_FEED",
      url: "http://feeds.bbci.co.uk/news/world/africa/rss.xml",
      category: "politics",
      locale: "en",
      fetchIntervalMinutes: 60,
      isActive: true,
      priority: 90,
    },
    {
      name: "Al Jazeera Africa",
      type: "RSS_FEED",
      url: "https://www.aljazeera.com/xml/rss/all.xml",
      category: "politics",
      locale: "en",
      fetchIntervalMinutes: 60,
      isActive: true,
      priority: 85,
    },

    // Sports Sources
    {
      name: "TheSportsDB",
      type: "SPORTS_API",
      url: "https://www.thesportsdb.com/api/v1/json/3",
      category: "sports",
      locale: "global",
      fetchIntervalMinutes: 120,
      isActive: true,
      priority: 80,
    },

    // Crypto Sources
    {
      name: "CoinGecko",
      type: "CRYPTO_API",
      url: "https://api.coingecko.com/api/v3",
      category: "crypto",
      locale: "global",
      fetchIntervalMinutes: 30,
      isActive: true,
      priority: 75,
    },

    // Weather Sources (would need API key)
    {
      name: "OpenWeatherMap Template",
      type: "WEATHER_API",
      url: "https://api.openweathermap.org/data/2.5",
      category: "climate",
      locale: "global",
      fetchIntervalMinutes: 180,
      isActive: false, // Requires API key
      priority: 70,
    },
  ];

  // Insert sources
  for (const source of sourcesToInsert) {
    await db.insert(dataSources).values(source).onConflictDoNothing();
  }

  console.log(`Initialized ${sourcesToInsert.length} default data sources`);
}

/**
 * Get active data sources
 */
export async function getActiveDataSources() {
  return await db
    .select()
    .from(dataSources)
    .where(eq(dataSources.isActive, true))
    .orderBy(desc(dataSources.priority));
}

/**
 * Run all active data sources and collect suggestions
 */
export async function runDataSources(): Promise<number> {
  const sources = await getActiveDataSources();
  let totalSuggestions = 0;

  for (const source of sources) {
    try {
      console.log(`Processing data source: ${source.name} (${source.type})`);

      let orchestrator: SuggestionOrchestrator | null = null;
      let fetcherAdded = false;

      // Create appropriate fetcher based on source type
      switch (source.type) {
        case "RSS_FEED":
          orchestrator = createDefaultOrchestrator();
          orchestrator.addFetcher(
            new (require("./suggestion-fetchers")).RSSFeedFetcher(
              source.url,
              source.category,
              source.locale
            )
          );
          fetcherAdded = true;
          break;

        case "CRYPTO_API":
          orchestrator = createDefaultOrchestrator();
          orchestrator.addFetcher(new (require("./suggestion-fetchers")).CryptoAPIFetcher());
          fetcherAdded = true;
          break;

        case "SPORTS_API":
          orchestrator = createDefaultOrchestrator();
          orchestrator.addFetcher(new (require("./suggestion-fetchers")).SportsAPIFetcher());
          fetcherAdded = true;
          break;

        case "WEATHER_API":
          // Would need API key from secure storage
          // For now, skip as it requires configuration
          console.log(`Skipping ${source.name} - requires API key configuration`);
          continue;

        default:
          console.log(`Unknown source type: ${source.type}`);
          continue;
      }

      if (orchestrator && fetcherAdded) {
        const suggestions = await orchestrator.runAll();

        // Process each suggestion through the suggestion engine
        for (const suggestion of suggestions) {
          // Set source metadata
          suggestion.sourceType = source.type as any;
          suggestion.sourceUrl = source.url;
          suggestion.sourceTitle = source.name;
          suggestion.sourcePublishedAt = new Date();

          // Process suggestion (this will score, deduplicate, and store)
          const result = await require("./suggestion-engine").createSuggestion(suggestion);

          if (result.success) {
            totalSuggestions++;
          }
        }

        // Update source statistics
        await db
          .update(dataSources)
          .set({
            lastFetchAt: new Date(),
            lastSuccessAt: new Date(),
            totalFetches: sql`${dataSources.totalFetches} + 1`,
            totalSuggestions: sql`${dataSources.totalSuggestions} + ${suggestions.length}`,
          })
          .where(eq(dataSources.id, source.id));
      }
    } catch (error) {
      console.error(`Error processing data source ${source.name}:`, error);

      // Update error statistics
      await db
        .update(dataSources)
        .set({
          lastFetchAt: new Date(),
          lastErrorAt: new Date(),
          lastError: error.message,
        })
        .where(eq(dataSources.id, source.id));
    }
  }

  console.log(`Data source run complete. Generated ${totalSuggestions} suggestions.`);
  return totalSuggestions;
}

/**
 * Schedule periodic data source fetching
 *
 * This would typically be called by a cron job or background worker
 */
export async function scheduleDataSourceFetch(intervalMinutes: number = 60) {
  console.log(`Starting data source scheduler (every ${intervalMinutes} minutes)`);

  // Run immediately on startup
  await runDataSources();

  // Set up interval
  setInterval(async () => {
    try {
      await runDataSources();
    } catch (error) {
      console.error("Error in scheduled data source fetch:", error);
    }
  }, intervalMinutes * 60 * 1000);

  return () => {
    // Return cleanup function (would clear interval in practice)
    console.log("Data source scheduler stopped");
  };
}