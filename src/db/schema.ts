import { pgTable, serial, text, integer, boolean, timestamp, real, index, check } from "drizzle-orm/pg-core";

// Users table (primarily registered via Phone Number, typical for African fintech platforms)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  phoneNumber: text("phone_number").notNull().unique(),
  name: text("name").notNull(),
  country: text("country").default("Kenya").notNull(), // Kenya, Uganda, Tanzania, Rwanda, Nigeria, Ghana, South Africa, DRC, Morocco, USA, India, Germany
  currency: text("currency").default("KES").notNull(), // KES, UGX, TZS, RWF
  balance: integer("balance").default(2500).notNull(), // Initial localized bonus balance (e.g. 2,500 KES)
  pinHash: text("pin_hash"), // NIST PROTECT: Hashed PIN for authentication (optional field for future use)
  // RBAC + policy attributes
  role: text("role").default("MEMBER").notNull(), // GUEST|MEMBER|CREATOR|RESOLVER|COMPLIANCE|TREASURY|ADMIN|SERVICE
  status: text("status").default("ACTIVE").notNull(), // ACTIVE|SUSPENDED|CLOSED
  kycTier: text("kyc_tier").default("BASIC").notNull(), // NONE|BASIC|VERIFIED|ENHANCED
  countryCode: text("country_code").default("KE").notNull(), // ISO-3166 alpha-2
  locale: text("locale").default("en").notNull(), // preferred UI language
  signupIp: text("signup_ip"), // captured at registration for geo/risk
  signupSource: text("signup_source").default("WEB").notNull(), // WEB|MOBILE|USSD|API
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Policy engine audit trail — every non-trivial decision is recorded so
// outcomes can be explained, replayed and reported to regulators.
export const policyAudit = pgTable("policy_audit", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(),
  effect: text("effect").notNull(), // ALLOW|DENY|REVIEW
  codes: text("codes").notNull(), // comma-separated reason codes
  reasons: text("reasons").notNull(),
  channel: text("channel").default("WEB").notNull(),
  ip: text("ip"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Prediction Markets
export const markets = pgTable("markets", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(), // "politics", "sports", "economy", "culture", "crypto", "tech", "climate"
  locale: text("locale").default("en").notNull(), // "en", "sw", "fr", "pt", "global"
  endsAt: timestamp("ends_at").notNull(),
  status: text("status").default("OPEN").notNull(), // "OPEN", "RESOLVED"
  winningOutcome: text("winning_outcome"), // "YES", "NO"
  oddsYes: real("odds_yes").default(1.85).notNull(),
  oddsNo: real("odds_no").default(1.85).notNull(),
  volume: integer("volume").default(0).notNull(), // total standard currency (KES) predicted
  isFeatured: boolean("is_featured").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Individual predictions
export const predictions = pgTable("predictions", {
  id: serial("id").primaryKey(),
  marketId: integer("market_id").references(() => markets.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  outcome: text("outcome").notNull(), // "YES" or "NO"
  amount: integer("amount").notNull(), // local currency amount
  potentialPayout: integer("potential_payout").notNull(),
  currency: text("currency").notNull(), // e.g. KES, UGX
  platform: text("platform").default("WEB").notNull(), // "WEB" or "USSD"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Chamas (localized communal savings/predictive pooling, highly popular in East Africa)
export const chamaPools = pgTable("chama_pools", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  marketId: integer("market_id").references(() => markets.id).notNull(),
  code: text("code").notNull().unique(), // shared with friends to join the Chama (e.g., "CHAMA-882")
  targetOutcome: text("target_outcome").notNull(), // The outcome the Chama is backing ("YES" or "NO")
  totalAmount: integer("total_amount").default(0).notNull(),
  currency: text("currency").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Chama member contributions
export const chamaMembers = pgTable("chama_members", {
  id: serial("id").primaryKey(),
  chamaId: integer("chama_id").references(() => chamaPools.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  contribution: integer("contribution").notNull(), // local currency contribution
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Transactions tracking mobile money logs
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // "DEPOSIT", "WITHDRAWAL", "PREDICT_BUY", "PREDICT_PAYOUT"
  amount: integer("amount").notNull(),
  currency: text("currency").notNull(),
  provider: text("provider").notNull(), // "M-PESA", "MTN_MOMO", "AIRTEL_MONEY", "WALLET"
  reference: text("reference").notNull().unique(), // e.g. MPESA receipt code (MP8247SKL9) or similar
  phoneNumber: text("phone_number").notNull(),
  status: text("status").notNull(), // "SUCCESS", "PENDING", "FAILED"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Seed versioning: lets new markets/users roll out to existing databases
export const appMeta = pgTable("app_meta", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

// Early-access waitlist: country-by-country rollout as mobile money and
// USSD short-code approvals land (marketing-site signup form).
export const earlyAccess = pgTable("early_access", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  country: text("country").notNull(),
  interest: text("interest").default("I want to predict").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================
// PREDICTION SUGGESTION ENGINE
// ============================================

// Suggested markets awaiting review/approval
export const marketSuggestions = pgTable("market_suggestions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  locale: text("locale").default("en").notNull(),
  suggestedEndsAt: timestamp("suggested_ends_at").notNull(),

  // Source tracking
  sourceType: text("source_type").notNull(), // "NEWS_API", "RSS_FEED", "TWITTER", "SPORTS_API", "CRYPTO_API", "WEATHER_API", "MANUAL"
  sourceUrl: text("source_url"),
  sourceTitle: text("source_title"),
  sourcePublishedAt: timestamp("source_published_at"),

  // Relevance scoring
  relevanceScore: real("relevance_score").default(0).notNull(), // 0-100
  trendingScore: real("trending_score").default(0).notNull(), // 0-100
  viralityScore: real("virality_score").default(0).notNull(), // 0-100
  localRelevanceScore: real("local_relevance_score").default(0).notNull(), // Africa-specific relevance

  // Initial probability estimate
  initialProbabilityYes: real("initial_probability_yes").default(0.5).notNull(),
  confidenceLevel: text("confidence_level").default("MEDIUM").notNull(), // "LOW", "MEDIUM", "HIGH"

  // Review workflow
  status: text("status").default("PENDING").notNull(), // "PENDING", "APPROVED", "REJECTED", "PUBLISHED"
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  rejectionReason: text("rejection_reason"),

  // Duplicate detection
  duplicateCheckHash: text("duplicate_check_hash").unique(),
  similarMarketIds: text("similar_market_ids"), // Comma-separated IDs of similar markets

  // Metadata
  tags: text("tags"), // JSON array of tags
  suggestedBy: text("suggested_by").default("SYSTEM").notNull(), // "SYSTEM" or userId
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Data source configurations
export const dataSources = pgTable("data_sources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  type: text("type").notNull(), // "NEWS_API", "RSS_FEED", "TWITTER", "SPORTS_API", "CRYPTO_API", "WEATHER_API"
  url: text("url").notNull(),
  apiKey: text("api_key"), // Encrypted
  category: text("category").notNull(),
  locale: text("locale").default("global").notNull(),

  // Configuration
  fetchIntervalMinutes: integer("fetch_interval_minutes").default(60).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  priority: integer("priority").default(50).notNull(), // 0-100, higher = more important

  // Statistics
  lastFetchAt: timestamp("last_fetch_at"),
  lastSuccessAt: timestamp("last_success_at"),
  lastErrorAt: timestamp("last_error_at"),
  lastError: text("last_error"),
  totalFetches: integer("total_fetches").default(0).notNull(),
  totalSuggestions: integer("total_suggestions").default(0).notNull(),
  totalApproved: integer("total_approved").default(0).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Suggestion review audit trail
export const suggestionReviews = pgTable("suggestion_reviews", {
  id: serial("id").primaryKey(),
  suggestionId: integer("suggestion_id").references(() => marketSuggestions.id).notNull(),
  reviewerId: integer("reviewer_id").references(() => users.id).notNull(),
  action: text("action").notNull(), // "APPROVE", "REJECT", "REQUEST_CHANGES", "COMMENT"
  comment: text("comment"),
  previousStatus: text("previous_status").notNull(),
  newStatus: text("new_status").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Trending topics tracking
export const trendingTopics = pgTable("trending_topics", {
  id: serial("id").primaryKey(),
  topic: text("topic").notNull(),
  category: text("category").notNull(),
  locale: text("locale").default("en").notNull(),

  // Metrics
  mentionCount: integer("mention_count").default(1).notNull(),
  trendingScore: real("trending_score").default(0).notNull(),
  velocityScore: real("velocity_score").default(0).notNull(), // Rate of growth

  // Source tracking
  sources: text("sources"), // JSON array of source URLs
  firstSeenAt: timestamp("first_seen_at").defaultNow().notNull(),
  lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
  peakAt: timestamp("peak_at"),

  // Market potential
  hasMarket: boolean("has_market").default(false).notNull(),
  marketId: integer("market_id").references(() => markets.id),

  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// NIST CSF ALIGNMENT: Database Security Enhancements
// Added pin_hash for authentication (PROTECT: Access Control)
// Indexes + CHECK constraints live in src/db/indexes.sql
// ============================================
