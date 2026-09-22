/**
 * Automated Market Maker (AMM) for Prediction Markets
 *
 * Implements the Logarithmic Market Scoring Rule (LMSR), the gold standard
 * for prediction market pricing. LMSR provides:
 *
 * 1. **Dynamic Pricing**: Odds adjust based on market activity
 * 2. **Bounded Loss**: Market maker loss is limited to liquidity parameter b
 * 3. **Always-On Liquidity**: Can always buy/sell shares at some price
 * 4. **Price Discovery**: Converges to crowd's probability estimate
 * 5. **Incentive Compatible**: Truthful reporting is optimal strategy
 *
 * ## How LMSR Works
 *
 * The cost function for the market maker is:
 *
 *   C(q₀, q₁) = b × ln(e^(q₀/b) + e^(q₁/b))
 *
 * Where:
 * - q₀ = quantity of shares outstanding for outcome NO
 * - q₁ = quantity of shares outstanding for outcome YES
 * - b = liquidity parameter (controls how quickly prices move)
 *
 * The instantaneous price (probability) for outcome YES is:
 *
 *   p₁ = e^(q₁/b) / (e^(q₀/b) + e^(q₁/b))
 *
 * This is a softmax function — prices are always between 0 and 1,
 * and sum to 1 across outcomes.
 *
 * ## Why LMSR?
 *
 * - **Used by**: Augur, Gnosis, Polymarket (variations)
 * - **Academic backing**: Robin Hanson (2002), proven optimal
 * - **Real-world tested**: Billions in volume across platforms
 * - **Capital efficient**: No need for order books or counterparties
 *
 * ## References
 *
 * - Hanson, R. (2002). "Logarithmic Market Scoring Rules for Modular Combinatorial Information Aggregation"
 * - Chen, Y., & Pennock, D. M. (2007). "A Utility Framework for Bounded-Loss Market Makers"
 * - Othman, A., & Sandholm, T. (2010). "Automated Market-Making in Prediction Markets"
 */

import { db } from "@/db";
import { markets, predictions } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

/**
 * Market state for LMSR calculations.
 */
export interface MarketState {
  /** Market ID */
  id: number;
  /** Outstanding shares for YES outcome */
  sharesYes: number;
  /** Outstanding shares for NO outcome */
  sharesNo: number;
  /** Liquidity parameter (controls price sensitivity) */
  liquidityParameter: number;
  /** Total volume traded (for analytics) */
  volume: number;
}

/**
 * Quote for buying shares in a prediction market.
 */
export interface Quote {
  /** Outcome being purchased */
  outcome: "YES" | "NO";
  /** Number of shares to buy */
  shares: number;
  /** Cost in local currency */
  cost: number;
  /** Average price per share */
  avgPrice: number;
  /** New probability after purchase (0-1) */
  newProbability: number;
  /** Effective odds (decimal odds format) */
  effectiveOdds: number;
  /** Market state after purchase */
  newState: MarketState;
}

/**
 * Configuration for AMM behavior.
 */
export interface AMMConfig {
  /**
   * Base liquidity parameter in USD.
   * Higher = less price movement per trade, more stable prices.
   * Lower = more price movement, faster discovery, higher volatility.
   *
   * Typical values:
   * - Small market: 100-500 USD
   * - Medium market: 500-2000 USD
   * - Large market: 2000-10000 USD
   */
  baseLiquidityUSD: number;

  /**
   * Minimum probability (prevents odds from going to infinity).
   * Default: 0.01 (1%, equivalent to 100x odds)
   */
  minProbability: number;

  /**
   * Maximum probability (prevents odds from going to zero).
   * Default: 0.99 (99%, equivalent to 1.01x odds)
   */
  maxProbability: number;

  /**
   * Minimum shares per trade (prevents dust trades).
   * Default: 1
   */
  minShares: number;

  /**
   * Maximum shares per trade (prevents market manipulation).
   * As a multiple of liquidity parameter.
   * Default: 10 (can buy up to 10× liquidity in one trade)
   */
  maxSharesMultiplier: number;
}

/**
 * Default AMM configuration.
 */
export const DEFAULT_AMM_CONFIG: AMMConfig = {
  baseLiquidityUSD: 1000, // $1000 base liquidity
  minProbability: 0.01,   // 1% (100x odds)
  maxProbability: 0.99,   // 99% (1.01x odds)
  minShares: 1,
  maxSharesMultiplier: 10,
};

/**
 * Calculate the LMSR cost function.
 *
 * C(q) = b × ln(e^(q₀/b) + e^(q₁/b))
 *
 * This is the total amount the market maker has paid out so far.
 */
export function lmsrCost(sharesNo: number, sharesYes: number, b: number): number {
  // Use log-sum-exp trick to avoid overflow:
  // ln(e^a + e^b) = max(a,b) + ln(1 + e^(min(a,b) - max(a,b)))
  const a = sharesNo / b;
  const expA = sharesYes / b;

  const maxExp = Math.max(a, expA);
  const sumExp = Math.exp(a - maxExp) + Math.exp(expA - maxExp);

  return b * (maxExp + Math.log(sumExp));
}

/**
 * Calculate the instantaneous probability for YES outcome.
 *
 * p(YES) = e^(q₁/b) / (e^(q₀/b) + e^(q₁/b))
 *
 * This is a softmax function.
 */
export function lmsrProbability(sharesNo: number, sharesYes: number, b: number): number {
  // Use log-sum-exp trick for numerical stability
  const a = sharesNo / b;
  const expA = sharesYes / b;

  const maxExp = Math.max(a, expA);
  const denominator = Math.exp(a - maxExp) + Math.exp(expA - maxExp);
  const numerator = Math.exp(expA - maxExp);

  return numerator / denominator;
}

/**
 * Calculate the cost to purchase `n` shares of a specific outcome.
 *
 * Cost = C(q₀', q₁') - C(q₀, q₁)
 *
 * Where (q₀', q₁') is the state after purchasing.
 */
export function calculatePurchaseCost(
  state: MarketState,
  outcome: "YES" | "NO",
  sharesToBuy: number
): number {
  const { sharesNo, sharesYes, liquidityParameter } = state;

  // Current cost
  const currentCost = lmsrCost(sharesNo, sharesYes, liquidityParameter);

  // New state after purchase
  const newSharesYes = outcome === "YES" ? sharesYes + sharesToBuy : sharesYes;
  const newSharesNo = outcome === "NO" ? sharesNo + sharesToBuy : sharesNo;

  // New cost
  const newCost = lmsrCost(newSharesNo, newSharesYes, liquidityParameter);

  // Purchase cost is the difference
  return newCost - currentCost;
}

/**
 * Get a quote for purchasing shares.
 *
 * This calculates the cost and new market state without executing the trade.
 */
export function getQuote(
  state: MarketState,
  outcome: "YES" | "NO",
  sharesToBuy: number,
  config: AMMConfig = DEFAULT_AMM_CONFIG
): Quote {
  // Validate shares
  if (sharesToBuy < config.minShares) {
    throw new Error(`Minimum purchase is ${config.minShares} shares`);
  }

  const maxShares = state.liquidityParameter * config.maxSharesMultiplier;
  if (sharesToBuy > maxShares) {
    throw new Error(`Maximum purchase is ${maxShares.toFixed(0)} shares (${config.maxSharesMultiplier}× liquidity)`);
  }

  // Calculate cost
  const cost = calculatePurchaseCost(state, outcome, sharesToBuy);

  // Calculate new state
  const newSharesYes = outcome === "YES" ? state.sharesYes + sharesToBuy : state.sharesYes;
  const newSharesNo = outcome === "NO" ? state.sharesNo + sharesToBuy : state.sharesNo;

  const newState: MarketState = {
    ...state,
    sharesYes: newSharesYes,
    sharesNo: newSharesNo,
  };

  // Calculate new probability
  const newProbability = lmsrProbability(newSharesNo, newSharesYes, state.liquidityParameter);

  // Clamp probability to min/max bounds
  const clampedProbability = Math.max(
    config.minProbability,
    Math.min(config.maxProbability, newProbability)
  );

  // Calculate effective odds (decimal odds format)
  // If buying YES, odds = 1 / P(YES)
  // If buying NO, odds = 1 / P(NO) = 1 / (1 - P(YES))
  const effectiveOdds = outcome === "YES"
    ? 1 / clampedProbability
    : 1 / (1 - clampedProbability);

  // Average price per share
  const avgPrice = cost / sharesToBuy;

  return {
    outcome,
    shares: sharesToBuy,
    cost,
    avgPrice,
    newProbability: clampedProbability,
    effectiveOdds,
    newState,
  };
}

/**
 * Calculate how many shares can be purchased with a given amount of currency.
 *
 * This uses binary search to find the number of shares, since the LMSR
 * cost function is non-linear.
 */
export function calculateSharesForAmount(
  state: MarketState,
  outcome: "YES" | "NO",
  amount: number,
  config: AMMConfig = DEFAULT_AMM_CONFIG
): number {
  // Binary search for the number of shares
  let low = config.minShares;
  let high = state.liquidityParameter * config.maxSharesMultiplier;
  let bestShares = low;

  const tolerance = 0.01; // 1% tolerance on amount

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const cost = calculatePurchaseCost(state, outcome, mid);

    if (Math.abs(cost - amount) <= tolerance * amount) {
      return mid;
    }

    if (cost < amount) {
      bestShares = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return bestShares;
}

/**
 * Get the current market state from the database.
 *
 * Calculates outstanding shares from predictions.
 */
export async function getMarketState(marketId: number): Promise<MarketState> {
  // Fetch market
  const marketList = await db.select().from(markets).where(eq(markets.id, marketId));
  const market = marketList[0];

  if (!market) {
    throw new Error("Market not found");
  }

  // Calculate outstanding shares from predictions
  // Each prediction creates shares equal to potentialPayout
  const sharesResult = await db
    .select({
      outcome: predictions.outcome,
      totalShares: sql<number>`COALESCE(SUM(${predictions.potentialPayout}), 0)`,
    })
    .from(predictions)
    .where(eq(predictions.marketId, marketId))
    .groupBy(predictions.outcome);

  let sharesYes = 0;
  let sharesNo = 0;

  for (const row of sharesResult) {
    if (row.outcome === "YES") {
      sharesYes = Number(row.totalShares);
    } else if (row.outcome === "NO") {
      sharesNo = Number(row.totalShares);
    }
  }

  // Calculate liquidity parameter based on market characteristics
  // Larger markets (more volume) get higher liquidity for stability
  const volumeMultiplier = Math.log10(Math.max(market.volume, 100)) / 2;
  const liquidityParameter = DEFAULT_AMM_CONFIG.baseLiquidityUSD * volumeMultiplier;

  return {
    id: market.id,
    sharesYes,
    sharesNo,
    liquidityParameter: Math.max(liquidityParameter, 100), // Minimum liquidity
    volume: market.volume,
  };
}

/**
 * Get current probability and odds for a market.
 */
export async function getMarketProbability(marketId: number): Promise<{
  probabilityYes: number;
  probabilityNo: number;
  oddsYes: number;
  oddsNo: number;
}> {
  const state = await getMarketState(marketId);

  const probabilityYes = lmsrProbability(
    state.sharesNo,
    state.sharesYes,
    state.liquidityParameter
  );

  // Clamp to min/max bounds
  const clampedProbYes = Math.max(
    DEFAULT_AMM_CONFIG.minProbability,
    Math.min(DEFAULT_AMM_CONFIG.maxProbability, probabilityYes)
  );

  const probabilityNo = 1 - clampedProbYes;

  // Convert to decimal odds
  const oddsYes = 1 / clampedProbYes;
  const oddsNo = 1 / probabilityNo;

  return {
    probabilityYes: clampedProbYes,
    probabilityNo,
    oddsYes,
    oddsNo,
  };
}

/**
 * Calculate effective odds for a specific trade amount.
 *
 * This is what users should see before placing a trade.
 */
export async function getEffectiveOdds(
  marketId: number,
  outcome: "YES" | "NO",
  amount: number
): Promise<{
  effectiveOdds: number;
  shares: number;
  cost: number;
  newProbability: number;
  priceImpact: number; // Percentage
}> {
  const state = await getMarketState(marketId);

  // Calculate shares for this amount
  const shares = calculateSharesForAmount(state, outcome, amount);

  // Get quote
  const quote = getQuote(state, outcome, shares);

  // Calculate current probability for price impact
  const currentProb = lmsrProbability(state.sharesNo, state.sharesYes, state.liquidityParameter);
  const priceImpact = outcome === "YES"
    ? ((quote.newProbability - currentProb) / currentProb) * 100
    : ((currentProb - quote.newProbability) / currentProb) * 100;

  return {
    effectiveOdds: quote.effectiveOdds,
    shares: quote.shares,
    cost: quote.cost,
    newProbability: quote.newProbability,
    priceImpact: Math.abs(priceImpact),
  };
}

/**
 * Migrate existing market to LMSR pricing.
 *
 * Sets initial shares to reflect current static odds.
 */
export async function migrateMarketToLMSR(
  marketId: number,
  targetProbabilityYes: number = 0.50
): Promise<MarketState> {
  // Initialize shares such that current probability matches target
  const b = DEFAULT_AMM_CONFIG.baseLiquidityUSD;

  // From p = e^(q₁/b) / (e^(q₀/b) + e^(q₁/b))
  // Solve for q₁ - q₀:
  // ln(p / (1-p)) = (q₁ - q₀) / b
  const logit = Math.log(targetProbabilityYes / (1 - targetProbabilityYes));
  const diff = logit * b;

  // Set q₀ = 0, q₁ = diff (arbitrary choice, only difference matters)
  const sharesYes = Math.max(0, diff);
  const sharesNo = Math.max(0, -diff);

  return {
    id: marketId,
    sharesYes,
    sharesNo,
    liquidityParameter: b,
    volume: 0,
  };
}

/**
 * Estimate market maker profit/loss for a resolved market.
 *
 * Profit = Total fees collected - Payouts
 */
export async function calculateMarketMakerPnL(
  marketId: number,
  winningOutcome: "YES" | "NO"
): Promise<{
  totalCollected: number;
  totalPayout: number;
  profit: number;
  profitPercentage: number;
}> {
  const state = await getMarketState(marketId);

  // Total collected = cost function at final state
  const totalCollected = lmsrCost(state.sharesNo, state.sharesYes, state.liquidityParameter);

  // Total payout = shares for winning outcome
  const totalPayout = winningOutcome === "YES" ? state.sharesYes : state.sharesNo;

  const profit = totalCollected - totalPayout;
  const profitPercentage = (profit / totalCollected) * 100;

  return {
    totalCollected,
    totalPayout,
    profit,
    profitPercentage,
  };
}
