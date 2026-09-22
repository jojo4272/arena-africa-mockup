/**
 * Data Source Integrators
 *
 * Connects to freely available APIs and data sources to fetch potential
 * prediction market opportunities.
 *
 * All sources are free tier with generous rate limits.
 */

import { MarketSuggestion, DataSourceType, calculateAfricaRelevance } from "./suggestion-engine";

/**
 * Base fetcher interface
 */
export interface DataFetcher {
  type: DataSourceType;
  fetch(): Promise<MarketSuggestion[]>;
}

/**
 * RSS Feed Parser
 *
 * Fetches and parses RSS feeds from news sources
 */
export class RSSFeedFetcher implements DataFetcher {
  type = DataSourceType.RSS_FEED;

  constructor(
    private feedUrl: string,
    private category: string,
    private locale: string = "en"
  ) {}

  async fetch(): Promise<MarketSuggestion[]> {
    const suggestions: MarketSuggestion[] = [];

    try {
      // Fetch RSS feed
      const response = await fetch(this.feedUrl);
      const xml = await response.text();

      // Parse RSS (simple XML parsing)
      const items = this.parseRSS(xml);

      for (const item of items) {
        // Convert news article to prediction market suggestion
        const suggestion = this.convertToSuggestion(item);
        if (suggestion) {
          suggestions.push(suggestion);
        }
      }
    } catch (error) {
      console.error(`RSS fetch error for ${this.feedUrl}:`, error);
    }

    return suggestions;
  }

  private parseRSS(xml: string): Array<{
    title: string;
    description: string;
    link: string;
    pubDate: string;
  }> {
    const items: Array<{
      title: string;
      description: string;
      link: string;
      pubDate: string;
    }> = [];

    // Simple regex-based RSS parsing (for production, use a proper XML parser)
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
      const itemXml = match[1];

      const title = this.extractTag(itemXml, 'title');
      const description = this.extractTag(itemXml, 'description');
      const link = this.extractTag(itemXml, 'link');
      const pubDate = this.extractTag(itemXml, 'pubDate');

      if (title && description) {
        items.push({ title, description, link, pubDate });
      }
    }

    return items.slice(0, 20); // Limit to 20 items
  }

  private extractTag(xml: string, tag: string): string {
    const regex = new RegExp(`<${tag}[^>]*>(.*?)<\/${tag}>`, 'is');
    const match = regex.exec(xml);
    if (match && match[1]) {
      // Decode HTML entities and strip CDATA
      return match[1]
        .replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/<[^>]*>/g, '') // Strip HTML tags
        .trim();
    }
    return '';
  }

  private convertToSuggestion(item: {
    title: string;
    description: string;
    link: string;
    pubDate: string;
  }): MarketSuggestion | null {
    // Extract predictable events from news headlines
    const title = item.title;
    const description = item.description;

    // Look for election-related news
    if (this.isElectionRelated(title, description)) {
      return this.createElectionMarket(item);
    }

    // Look for sports events
    if (this.isSportsRelated(title, description)) {
      return this.createSportsMarket(item);
    }

    // Look for economic indicators
    if (this.isEconomicRelated(title, description)) {
      return this.createEconomicMarket(item);
    }

    // Look for climate/weather events
    if (this.isClimateRelated(title, description)) {
      return this.createClimateMarket(item);
    }

    return null;
  }

  private isElectionRelated(title: string, description: string): boolean {
    const text = `${title} ${description}`.toLowerCase();
    return /election|vote|poll|ballot|candidate|president|parliament|referendum/.test(text);
  }

  private isSportsRelated(title: string, description: string): boolean {
    const text = `${title} ${description}`.toLowerCase();
    return /match|tournament|championship|cup|league|win|defeat|score|team/.test(text);
  }

  private isEconomicRelated(title: string, description: string): boolean {
    const text = `${title} ${description}`.toLowerCase();
    return /gdp|inflation|interest rate|stock|market|economy|growth|recession|unemployment/.test(text);
  }

  private isClimateRelated(title: string, description: string): boolean {
    const text = `${title} ${description}`.toLowerCase();
    return /rainfall|drought|flood|cyclone|hurricane|climate|weather|temperature|El Niño/.test(text);
  }

  private createElectionMarket(item: {
    title: string;
    description: string;
    link: string;
    pubDate: string;
  }): MarketSuggestion {
    // Infer end date (elections are usually announced with dates)
    const endsAt = this.inferEndDate(item.title, item.description, 90); // Default 90 days

    const localRelevance = calculateAfricaRelevance(item.title, item.description);

    return {
      title: this.generatePredictionTitle(item.title),
      description: item.description.substring(0, 500),
      category: "politics",
      locale: this.locale,
      suggestedEndsAt: endsAt,

      sourceType: this.type,
      sourceUrl: item.link,
      sourceTitle: item.title,
      sourcePublishedAt: new Date(item.pubDate || Date.now()),

      relevanceScore: 0, // Will be calculated by engine
      trendingScore: 70, // Moderate trending for news
      viralityScore: 50,
      localRelevanceScore: localRelevance,

      initialProbabilityYes: 0.50,
      confidenceLevel: "MEDIUM",

      tags: [],
      suggestedBy: "SYSTEM",
    };
  }

  private createSportsMarket(item: {
    title: string;
    description: string;
    link: string;
    pubDate: string;
  }): MarketSuggestion {
    const endsAt = this.inferEndDate(item.title, item.description, 30);
    const localRelevance = calculateAfricaRelevance(item.title, item.description);

    return {
      title: this.generatePredictionTitle(item.title),
      description: item.description.substring(0, 500),
      category: "sports",
      locale: this.locale,
      suggestedEndsAt: endsAt,

      sourceType: this.type,
      sourceUrl: item.link,
      sourceTitle: item.title,
      sourcePublishedAt: new Date(item.pubDate || Date.now()),

      relevanceScore: 0,
      trendingScore: 80, // Sports news is highly trending
      viralityScore: 70,
      localRelevanceScore: localRelevance,

      initialProbabilityYes: 0.50,
      confidenceLevel: "MEDIUM",

      tags: [],
      suggestedBy: "SYSTEM",
    };
  }

  private createEconomicMarket(item: {
    title: string;
    description: string;
    link: string;
    pubDate: string;
  }): MarketSuggestion {
    const endsAt = this.inferEndDate(item.title, item.description, 60);
    const localRelevance = calculateAfricaRelevance(item.title, item.description);

    return {
      title: this.generatePredictionTitle(item.title),
      description: item.description.substring(0, 500),
      category: "economy",
      locale: this.locale,
      suggestedEndsAt: endsAt,

      sourceType: this.type,
      sourceUrl: item.link,
      sourceTitle: item.title,
      sourcePublishedAt: new Date(item.pubDate || Date.now()),

      relevanceScore: 0,
      trendingScore: 60,
      viralityScore: 40,
      localRelevanceScore: localRelevance,

      initialProbabilityYes: 0.50,
      confidenceLevel: "LOW",

      tags: [],
      suggestedBy: "SYSTEM",
    };
  }

  private createClimateMarket(item: {
    title: string;
    description: string;
    link: string;
    pubDate: string;
  }): MarketSuggestion {
    const endsAt = this.inferEndDate(item.title, item.description, 45);
    const localRelevance = calculateAfricaRelevance(item.title, item.description);

    return {
      title: this.generatePredictionTitle(item.title),
      description: item.description.substring(0, 500),
      category: "climate",
      locale: this.locale,
      suggestedEndsAt: endsAt,

      sourceType: this.type,
      sourceUrl: item.link,
      sourceTitle: item.title,
      sourcePublishedAt: new Date(item.pubDate || Date.now()),

      relevanceScore: 0,
      trendingScore: 55,
      viralityScore: 45,
      localRelevanceScore: localRelevance,

      initialProbabilityYes: 0.50,
      confidenceLevel: "LOW",

      tags: [],
      suggestedBy: "SYSTEM",
    };
  }

  private generatePredictionTitle(newsTitle: string): string {
    // Convert news headline to predictable question

    // Remove common news prefixes
    let title = newsTitle
      .replace(/^(Breaking|Update|Latest|News):\s*/i, '')
      .trim();

    // If already a question, return it
    if (title.endsWith('?')) {
      return title;
    }

    // Add "Will..." prefix if not present
    if (!/^(will|can|should|is|are)/i.test(title)) {
      title = `Will ${title.charAt(0).toLowerCase()}${title.slice(1)}`;
    }

    // Ensure it ends with question mark
    if (!title.endsWith('?')) {
      title += '?';
    }

    // Limit length
    if (title.length > 200) {
      title = title.substring(0, 197) + '...?';
    }

    return title;
  }

  private inferEndDate(title: string, description: string, defaultDays: number): Date {
    const text = `${title} ${description}`.toLowerCase();

    // Look for date patterns
    const datePatterns = [
      /(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})/i,
      /(\d{4})-(\d{2})-(\d{2})/,
      /in\s+(\d+)\s+(days?|weeks?|months?)/i,
      /by\s+end\s+of\s+(january|february|march|april|may|june|july|august|september|october|november|december)/i,
    ];

    for (const pattern of datePatterns) {
      const match = pattern.exec(text);
      if (match) {
        try {
          // Parse matched date
          if (match[1] && match[2] && match[3]) {
            // Day Month Year format
            const date = new Date(`${match[2]} ${match[1]}, ${match[3]}`);
            if (date > new Date()) return date;
          } else if (match[0].includes('-')) {
            // ISO format
            const date = new Date(match[0]);
            if (date > new Date()) return date;
          } else if (match[0].includes('in')) {
            // Relative date
            const value = parseInt(match[1]);
            const unit = match[2];
            const days = unit.includes('day') ? value : unit.includes('week') ? value * 7 : value * 30;
            return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
          }
        } catch (e) {
          // Date parsing failed, use default
        }
      }
    }

    // Default to N days from now
    return new Date(Date.now() + defaultDays * 24 * 60 * 60 * 1000);
  }
}

/**
 * CoinGecko Crypto API Fetcher
 *
 * Fetches trending cryptocurrencies and creates prediction markets
 */
export class CryptoAPIFetcher implements DataFetcher {
  type = DataSourceType.CRYPTO_API;

  constructor(private apiUrl: string = "https://api.coingecko.com/api/v3") {}

  async fetch(): Promise<MarketSuggestion[]> {
    const suggestions: MarketSuggestion[] = [];

    try {
      // Fetch trending coins
      const response = await fetch(`${this.apiUrl}/search/trending`);
      const data = await response.json();

      if (data.coins) {
        for (const coin of data.coins.slice(0, 10)) {
          const coinData = coin.item;
          const suggestion = this.createCryptoMarket(coinData);
          suggestions.push(suggestion);
        }
      }
    } catch (error) {
      console.error('CoinGecko API error:', error);
    }

    return suggestions;
  }

  private createCryptoMarket(coinData: any): MarketSuggestion {
    const coinName = coinData.name;
    const symbol = coinData.symbol?.toUpperCase();
    const currentPrice = coinData.price_btc || 0;

    // Create price prediction markets
    const title = `Will ${coinName} (${symbol}) increase by 10% in the next 30 days?`;
    const description = `${coinName} is currently trending. Predict whether ${symbol} will gain at least 10% value in the next 30 days.`;

    const endsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    return {
      title,
      description,
      category: "crypto",
      locale: "global",
      suggestedEndsAt: endsAt,

      sourceType: this.type,
      sourceUrl: `https://www.coingecko.com/en/coins/${coinData.id}`,
      sourceTitle: `${coinName} Trending`,
      sourcePublishedAt: new Date(),

      relevanceScore: 0,
      trendingScore: coinData.score || 70,
      viralityScore: 80,
      localRelevanceScore: 30, // Crypto is global, moderate Africa relevance

      initialProbabilityYes: 0.50,
      confidenceLevel: "LOW", // Crypto is volatile

      tags: [],
      suggestedBy: "SYSTEM",
    };
  }
}

/**
 * Sports API Fetcher (TheSportsDB - Free API)
 *
 * Fetches upcoming sports events and creates prediction markets
 */
export class SportsAPIFetcher implements DataFetcher {
  type = DataSourceType.SPORTS_API;

  constructor(
    private apiUrl: string = "https://www.thesportsdb.com/api/v1/json/3"
  ) {}

  async fetch(): Promise<MarketSuggestion[]> {
    const suggestions: MarketSuggestion[] = [];

    try {
      // Fetch upcoming events for popular leagues
      const leagues = [
        { id: 4328, name: "English Premier League", sport: "Soccer" },
        { id: 4380, name: "UEFA Champions League", sport: "Soccer" },
        { id: 4391, name: "African Cup of Nations", sport: "Soccer" },
      ];

      for (const league of leagues) {
        const response = await fetch(
          `${this.apiUrl}/eventsnextleague.php?id=${league.id}`
        );
        const data = await response.json();

        if (data.events) {
          for (const event of data.events.slice(0, 5)) {
            const suggestion = this.createSportsMarket(event, league);
            suggestions.push(suggestion);
          }
        }
      }
    } catch (error) {
      console.error('TheSportsDB API error:', error);
    }

    return suggestions;
  }

  private createSportsMarket(event: any, league: any): MarketSuggestion {
    const homeTeam = event.strHomeTeam;
    const awayTeam = event.strAwayTeam;
    const eventDate = new Date(event.dateEvent);

    // Create match prediction market
    const title = `Will ${homeTeam} win against ${awayTeam}?`;
    const description = `${league.name} match: ${homeTeam} vs ${awayTeam} on ${eventDate.toDateString()}. Predict the outcome.`;

    // Market ends at match time
    const endsAt = new Date(eventDate.getTime() - 60 * 60 * 1000); // 1 hour before match

    const localRelevance = calculateAfricaRelevance(
      `${homeTeam} ${awayTeam} ${league.name}`,
      description
    );

    return {
      title,
      description,
      category: "sports",
      locale: "global",
      suggestedEndsAt: endsAt,

      sourceType: this.type,
      sourceUrl: `https://www.thesportsdb.com/event/${event.idEvent}`,
      sourceTitle: `${homeTeam} vs ${awayTeam}`,
      sourcePublishedAt: new Date(),

      relevanceScore: 0,
      trendingScore: 75,
      viralityScore: 70,
      localRelevanceScore: localRelevance,

      initialProbabilityYes: 0.50, // Neutral odds by default
      confidenceLevel: "MEDIUM",

      tags: [],
      suggestedBy: "SYSTEM",
    };
  }
}

/**
 * Weather API Fetcher
 *
 * Creates prediction markets for weather events (rainfall, temperature, etc.)
 */
export class WeatherAPIFetcher implements DataFetcher {
  type = DataSourceType.WEATHER_API;

  constructor(
    private apiKey: string,
    private apiUrl: string = "https://api.openweathermap.org/data/2.5"
  ) {}

  async fetch(): Promise<MarketSuggestion[]> {
    const suggestions: MarketSuggestion[] = [];

    try {
      // Fetch weather for major African cities
      const cities = [
        { name: "Nairobi", country: "KE", lat: -1.286389, lon: 36.817223 },
        { name: "Lagos", country: "NG", lat: 6.5244, lon: 3.3792 },
        { name: "Cairo", country: "EG", lat: 30.0444, lon: 31.2357 },
        { name: "Johannesburg", country: "ZA", lat: -26.2041, lon: 28.0473 },
      ];

      for (const city of cities) {
        const response = await fetch(
          `${this.apiUrl}/forecast?lat=${city.lat}&lon=${city.lon}&appid=${this.apiKey}&units=metric`
        );
        const data = await response.json();

        if (data.list) {
          const suggestion = this.createWeatherMarket(city, data);
          suggestions.push(suggestion);
        }
      }
    } catch (error) {
      console.error('OpenWeatherMap API error:', error);
    }

    return suggestions;
  }

  private createWeatherMarket(city: any, forecast: any): MarketSuggestion {
    // Look for significant weather events in forecast
    const next7Days = forecast.list.slice(0, 14); // 7 days (3-hour intervals)

    // Check for rain probability
    const rainDays = next7Days.filter((f: any) => f.pop > 0.5).length;
    const willRain = rainDays > 5;

    const title = `Will it rain in ${city.name} in the next 7 days?`;
    const description = `Based on current weather patterns, predict whether ${city.name}, ${city.country} will experience rainfall in the next week.`;

    const endsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    return {
      title,
      description,
      category: "climate",
      locale: "en",
      suggestedEndsAt: endsAt,

      sourceType: this.type,
      sourceUrl: `https://openweathermap.org/city/${city.name}`,
      sourceTitle: `Weather Forecast - ${city.name}`,
      sourcePublishedAt: new Date(),

      relevanceScore: 0,
      trendingScore: 50,
      viralityScore: 40,
      localRelevanceScore: 100, // Weather is very locally relevant

      initialProbabilityYes: willRain ? 0.70 : 0.30,
      confidenceLevel: "MEDIUM",

      tags: [],
      suggestedBy: "SYSTEM",
    };
  }
}

/**
 * Master orchestrator that runs all fetchers
 */
export class SuggestionOrchestrator {
  private fetchers: DataFetcher[] = [];

  addFetcher(fetcher: DataFetcher) {
    this.fetchers.push(fetcher);
  }

  async runAll(): Promise<MarketSuggestion[]> {
    const allSuggestions: MarketSuggestion[] = [];

    for (const fetcher of this.fetchers) {
      try {
        console.log(`Running ${fetcher.type} fetcher...`);
        const suggestions = await fetcher.fetch();
        allSuggestions.push(...suggestions);
        console.log(`${fetcher.type} fetcher: ${suggestions.length} suggestions`);
      } catch (error) {
        console.error(`Error in ${fetcher.type} fetcher:`, error);
      }
    }

    return allSuggestions;
  }
}

/**
 * Initialize default fetchers with free data sources
 */
export function createDefaultOrchestrator(config?: {
  coinGeckoEnabled?: boolean;
  rssFeedsEnabled?: boolean;
  sportsApiEnabled?: boolean;
  weatherApiKey?: string;
}): SuggestionOrchestrator {
  const orchestrator = new SuggestionOrchestrator();

  // RSS Feeds (Always free, no API key needed)
  if (config?.rssFeedsEnabled !== false) {
    orchestrator.addFetcher(
      new RSSFeedFetcher("http://feeds.bbci.co.uk/news/world/africa/rss.xml", "politics", "en")
    );
    orchestrator.addFetcher(
      new RSSFeedFetcher("https://www.aljazeera.com/xml/rss/all.xml", "politics", "en")
    );
  }

  // CoinGecko (Free, no API key needed)
  if (config?.coinGeckoEnabled !== false) {
    orchestrator.addFetcher(new CryptoAPIFetcher());
  }

  // TheSportsDB (Free, no API key needed)
  if (config?.sportsApiEnabled !== false) {
    orchestrator.addFetcher(new SportsAPIFetcher());
  }

  // OpenWeatherMap (Requires free API key)
  if (config?.weatherApiKey) {
    orchestrator.addFetcher(new WeatherAPIFetcher(config.weatherApiKey));
  }

  return orchestrator;
}
