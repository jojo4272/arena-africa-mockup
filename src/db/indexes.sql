-- NIST CSF PROTECT (Data Integrity) + performance
-- Apply after drizzle-kit push. Safe to re-run (IF NOT EXISTS).

-- Indexes for query performance at scale
CREATE INDEX IF NOT EXISTS idx_users_phone ON users (phone_number);
CREATE INDEX IF NOT EXISTS idx_predictions_user_market ON predictions (user_id, market_id);
CREATE INDEX IF NOT EXISTS idx_predictions_created ON predictions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_markets_category ON markets (category);
CREATE INDEX IF NOT EXISTS idx_markets_locale ON markets (locale);
CREATE INDEX IF NOT EXISTS idx_markets_status ON markets (status);
CREATE INDEX IF NOT EXISTS idx_chama_code ON chama_pools (code);
CREATE INDEX IF NOT EXISTS idx_chama_market ON chama_pools (market_id);
CREATE INDEX IF NOT EXISTS idx_chama_members_chama ON chama_members (chama_id);

-- Indexes for suggestion engine
CREATE INDEX IF NOT EXISTS idx_market_suggestions_status ON marketSuggestions (status);
CREATE INDEX IF NOT EXISTS idx_market_suggestions_created ON marketSuggestions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_suggestions_category ON marketSuggestions (category);
CREATE INDEX IF NOT EXISTS idx_market_suggestions_locale ON marketSuggestions (locale);
CREATE INDEX IF NOT EXISTS idx_market_suggestions_duplicate_hash ON marketSuggestions (duplicateHash);
CREATE INDEX IF NOT EXISTS idx_market_suggestions_source_type ON marketSuggestions (sourceType);
CREATE INDEX IF NOT EXISTS idx_suggestion_reviews_suggestion_id ON suggestionReviews (suggestionId);
CREATE INDEX IF NOT EXISTS idx_suggestion_reviews_created ON suggestionReviews (createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_trending_topics_velocity ON trendingTopics (velocityScore DESC);
CREATE INDEX IF NOT EXISTS idx_trending_topics_updated ON trendingTopics (updatedAt DESC);
CREATE INDEX IF NOT EXISTS idx_trending_topics_category ON trendingTopics (category);
CREATE INDEX IF NOT EXISTS idx_trending_topics_locale ON trendingTopics (locale);
CREATE INDEX IF NOT EXISTS idx_data_sources_active ON dataSources (isActive);
CREATE INDEX IF NOT EXISTS idx_data_sources_priority ON dataSources (priority DESC);
CREATE INDEX IF NOT EXISTS idx_data_sources_type ON dataSources (type);

-- CHECK constraints (data integrity — prevent negative/invalid values)
ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_users_balance;
ALTER TABLE users ADD CONSTRAINT chk_users_balance CHECK (balance >= 0);

ALTER TABLE markets DROP CONSTRAINT IF EXISTS chk_markets_odds_yes;
ALTER TABLE markets ADD CONSTRAINT chk_markets_odds_yes CHECK (odds_yes >= 1.0);
ALTER TABLE markets DROP CONSTRAINT IF EXISTS chk_markets_odds_no;
ALTER TABLE markets ADD CONSTRAINT chk_markets_odds_no CHECK (odds_no >= 1.0);
ALTER TABLE markets DROP CONSTRAINT IF EXISTS chk_markets_volume;
ALTER TABLE markets ADD CONSTRAINT chk_markets_volume CHECK (volume >= 0);

ALTER TABLE predictions DROP CONSTRAINT IF EXISTS chk_predictions_amount;
ALTER TABLE predictions ADD CONSTRAINT chk_predictions_amount CHECK (amount > 0);
ALTER TABLE predictions DROP CONSTRAINT IF EXISTS chk_predictions_payout;
ALTER TABLE predictions ADD CONSTRAINT chk_predictions_payout CHECK (potential_payout > 0);
ALTER TABLE predictions DROP CONSTRAINT IF EXISTS chk_predictions_outcome;
ALTER TABLE predictions ADD CONSTRAINT chk_predictions_outcome CHECK (outcome IN ('YES', 'NO'));

ALTER TABLE chama_pools DROP CONSTRAINT IF EXISTS chk_chama_total;
ALTER TABLE chama_pools ADD CONSTRAINT chk_chama_total CHECK (total_amount >= 0);

ALTER TABLE chama_members DROP CONSTRAINT IF EXISTS chk_chama_contribution;
ALTER TABLE chama_members ADD CONSTRAINT chk_chama_contribution CHECK (contribution > 0);

ALTER TABLE transactions DROP CONSTRAINT IF EXISTS chk_txn_amount;
ALTER TABLE transactions ADD CONSTRAINT chk_txn_amount CHECK (amount > 0);
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS chk_txn_status;
ALTER TABLE transactions ADD CONSTRAINT chk_txn_status CHECK (status IN ('SUCCESS', 'PENDING', 'FAILED'));
