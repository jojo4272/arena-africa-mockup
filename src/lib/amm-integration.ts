/**
 * AMM Integration Layer
 *
 * This module provides high-level functions that integrate the LMSR AMM
 * with the existing Arena Africa codebase.
 */

import { db } from "@/db";
import { markets, predictions } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  getMarketState,
  getMarketProbability,
  getEffectiveOdds,
  calculateSharesForAmount,
  getQuote,
  type MarketState,
} from "@/lib/amm";
import { toUsd } from "@/lib/rates";

/**
 * Get dynamic odds for a market (replaces static odds).
 *
 * This should be called when displaying market cards to users.
 */
export async function getDynamicMarketOdds(marketId: number): Promise<{
  oddsYes: number;
  oddsNo: number;
  probabilityYes: number;
  probabilityNo: number;
  lastUpdated: Date;
}> {
  const odds = await getMarketProbability(marketId);

  return {
    oddsYes: odds.oddsYes,
    oddsNo: odds.oddsNo,
    probabilityYes: odds.probabilityYes,
    probabilityNo: odds.probabilityNo,
    lastUpdated: new Date(),
  };
}

/**
 * Get a prediction quote with all details users need before trading.
 *
 * Includes: effective odds, shares, cost, price impact.
 */
export async function getPredictionQuote(
  marketId: number,
  outcome: "YES" | "NO",
  amount: number,
  currency: string
): Promise<{
  outcome: "YES" | "NO";
  amount: number;
  currency: string;
  shares: number;
  effectiveOdds: number;
  avgPrice: number;
  potentialPayout: number;
  priceImpact: number;
  priceImpactWarning: boolean;
  newMarketOdds: {
    oddsYes: number;
    oddsNo: number;
  };
}> {
  // Get effective odds for this specific trade
  const quote = await getEffectiveOdds(marketId, outcome, amount);

  // Get new market odds after this trade
  const state = await getMarketState(marketId);
  const fullQuote = getQuote(state, outcome, quote.shares);

  const newOddsYes = outcome === "YES"
    ? fullQuote.effectiveOdds
    : 1 / fullQuote.newProbability;

  const newOddsNo = outcome === "NO"
    ? fullQuote.effectiveOdds
    : 1 / (1 - fullQuote.newProbability);

  // Warning if price impact is significant (>5%)
  const priceImpactWarning = quote.priceImpact > 5.0;

  return {
    outcome,
    amount,
    currency,
    shares: quote.shares,
    effectiveOdds: quote.effectiveOdds,
    avgPrice: quote.cost / quote.shares,
    potentialPayout: quote.shares, // Shares = payout at resolution
    priceImpact: quote.priceImpact,
    priceImpactWarning,
    newMarketOdds: {
      oddsYes: newOddsYes,
      oddsNo: newOddsNo,
    },
  };
}

/**
 * Calculate the optimal bet size for a given bankroll and edge.
 *
 * Uses Kelly Criterion for optimal capital allocation.
 *
 * @param bankroll - User's total balance
 * @param trueProb - User's belief of true probability (0-1)
 * @param marketOdds - Current market odds (decimal)
 * @param fractionKelly - Fraction of Kelly to bet (default: 0.25 for quarter-Kelly)
 */
export function calculateOptimalBetSize(
  bankroll: number,
  trueProb: number,
  marketOdds: number,
  fractionKelly: number = 0.25
): {
  optimalBet: number;
  expectedValue: number;
  kellyFraction: number;
  recommendation: "STRONG_BET" | "MODERATE_BET" | "WEAK_BET" | "NO_BET";
} {
  // Kelly Criterion: f* = (p × (b+1) - 1) / b
  // Where p = true probability, b = odds - 1
  const b = marketOdds - 1;
  const kellyFraction = (trueProb * (b + 1) - 1) / b;

  // Apply fractional Kelly (more conservative)
  const adjustedKelly = Math.max(0, kellyFraction * fractionKelly);
  const optimalBet = Math.floor(bankroll * adjustedKelly);

  // Calculate expected value
  const expectedValue = (trueProb * marketOdds - 1) * optimalBet;

  // Recommendation based on Kelly percentage
  let recommendation: "STRONG_BET" | "MODERATE_BET" | "WEAK_BET" | "NO_BET";
  if (adjustedKelly <= 0) {
    recommendation = "NO_BET";
  } else if (adjustedKelly > 0.1) {
    recommendation = "STRONG_BET";
  } else if (adjustedKelly > 0.05) {
    recommendation = "MODERATE_BET";
  } else {
    recommendation = "WEAK_BET";
  }

  return {
    optimalBet,
    expectedValue,
    kellyFraction: adjustedKelly,
    recommendation,
  };
}

/**
 * Get market depth - how much liquidity is available at different price levels.
 *
 * Useful for showing users how their trade will affect the market.
 */
export async function getMarketDepth(
  marketId: number,
  outcome: "YES" | "NO",
  maxAmount: number,
  steps: number = 10
): Promise<Array<{
  amount: number;
  shares: number;
  avgPrice: number;
  effectiveOdds: number;
  priceImpact: number;
}>> {
  const state = await getMarketState(marketId);
  const currentProb = await getMarketProbability(marketId);
  const initialProb = outcome === "YES" ? currentProb.probabilityYes : currentProb.probabilityNo;

  const depth = [];
  const stepSize = maxAmount / steps;

  for (let i = 1; i <= steps; i++) {
    const amount = stepSize * i;
    const shares = calculateSharesForAmount(state, outcome, amount);
    const quote = getQuote(state, outcome, shares);

    const newProb = outcome === "YES" ? quote.newProbability : 1 - quote.newProbability;
    const priceImpact = ((newProb - initialProb) / initialProb) * 100;

    depth.push({
      amount,
      shares,
      avgPrice: quote.avgPrice,
      effectiveOdds: quote.effectiveOdds,
      priceImpact: Math.abs(priceImpact),
    });
  }

  return depth;
}

/**
 * Get historical probability chart data.
 *
 * Returns probability at each prediction timestamp for charting.
 */
export async function getMarketProbabilityHistory(
  marketId: number,
  limit: number = 100
): Promise<Array<{
  timestamp: Date;
  probabilityYes: number;
  probabilityNo: number;
  oddsYes: number;
  oddsNo: number;
  sharesYes: number;
  sharesNo: number;
}>> {
  // Get all predictions for this market
  const preds = await db
    .select()
    .from(predictions)
    .where(eq(predictions.marketId, marketId))
    .orderBy(predictions.createdAt)
    .limit(limit);

  if (preds.length === 0) {
    return [];
  }

  const state = await getMarketState(marketId);
  const history = [];

  let runningSharesYes = 0;
  let runningSharesNo = 0;

  for (const pred of preds) {
    // Update running totals
    if (pred.outcome === "YES") {
      runningSharesYes += pred.potentialPayout;
    } else {
      runningSharesNo += pred.potentialPayout;
    }

    // Calculate probability at this point
    const probYes = runningSharesYes / (runningSharesYes + runningSharesNo) || 0.5;
    const probNo = 1 - probYes;

    history.push({
      timestamp: pred.createdAt,
      probabilityYes: probYes,
      probabilityNo: probNo,
      oddsYes: 1 / probYes,
      oddsNo: 1 / probNo,
      sharesYes: runningSharesYes,
      sharesNo: runningSharesNo,
    });
  }

  return history;
}

/**
 * Detect if a market is being manipulated.
 *
 * Flags suspicious patterns:
 * - Rapid price swings
 * - Single user dominance
 * - Wash trading patterns
 */
export async function detectMarketManipulation(
  marketId: number,
  lookbackMinutes: number = 60
): Promise<{
  isManipulated: boolean;
  signals: Array<{
    type: "RAPID_SWING" | "USER_DOMINANCE" | "WASH_TRADING" | "PRICE_PINNING";
    severity: "LOW" | "MEDIUM" | "HIGH";
    description: string;
  }>;
  confidenceScore: number;
}> {
  const signals: Array<{
    type: "RAPID_SWING" | "USER_DOMINANCE" | "WASH_TRADING" | "PRICE_PINNING";
    severity: "LOW" | "MEDIUM" | "HIGH";
    description: string;
  }> = [];

  // Get recent predictions
  const cutoff = new Date(Date.now() - lookbackMinutes * 60 * 1000);
  const recentPreds = await db
    .select()
    .from(predictions)
    .where(eq(predictions.marketId, marketId))
    .orderBy(predictions.createdAt);

  if (recentPreds.length < 5) {
    return {
      isManipulated: false,
      signals: [],
      confidenceScore: 0,
    };
  }

  // Check 1: Rapid price swings (probability changes >20% in short time)
  const probHistory = await getMarketProbabilityHistory(marketId, 50);
  if (probHistory.length >= 2) {
    let maxSwing = 0;
    for (let i = 1; i < probHistory.length; i++) {
      const swing = Math.abs(probHistory[i].probabilityYes - probHistory[i - 1].probabilityYes);
      maxSwing = Math.max(maxSwing, swing);
    }

    if (maxSwing > 0.20) {
      signals.push({
        type: "RAPID_SWING",
        severity: maxSwing > 0.30 ? "HIGH" : "MEDIUM",
        description: `Probability swung ${(maxSwing * 100).toFixed(1)}% in short time`,
      });
    }
  }

  // Check 2: Single user dominance (one user >60% of volume)
  const volumeByUser = new Map<number, number>();
  let totalVolume = 0;

  for (const pred of recentPreds) {
    volumeByUser.set(pred.userId, (volumeByUser.get(pred.userId) || 0) + pred.amount);
    totalVolume += pred.amount;
  }

  for (const [userId, volume] of volumeByUser.entries()) {
    const dominance = volume / totalVolume;
    if (dominance > 0.60) {
      signals.push({
        type: "USER_DOMINANCE",
        severity: dominance > 0.80 ? "HIGH" : "MEDIUM",
        description: `Single user controls ${(dominance * 100).toFixed(1)}% of volume`,
      });
    }
  }

  // Check 3: Wash trading (same user betting both sides rapidly)
  const userOutcomes = new Map<number, Set<string>>();
  for (const pred of recentPreds) {
    if (!userOutcomes.has(pred.userId)) {
      userOutcomes.set(pred.userId, new Set());
    }
    userOutcomes.get(pred.userId)!.add(pred.outcome);
  }

  for (const [userId, outcomes] of userOutcomes.entries()) {
    if (outcomes.size === 2) {
      const userPreds = recentPreds.filter(p => p.userId === userId);
      if (userPreds.length >= 4) {
        signals.push({
          type: "WASH_TRADING",
          severity: "MEDIUM",
          description: `User ${userId} rapidly trading both sides`,
        });
      }
    }
  }

  // Calculate confidence score
  let confidenceScore = 0;
  for (const signal of signals) {
    if (signal.severity === "HIGH") confidenceScore += 0.4;
    else if (signal.severity === "MEDIUM") confidenceScore += 0.2;
    else confidenceScore += 0.1;
  }
  confidenceScore = Math.min(1.0, confidenceScore);

  return {
    isManipulated: confidenceScore > 0.5,
    signals,
    confidenceScore,
  };
}

/**
 * Calculate platform revenue from a market.
 *
 * Platform can optionally charge a fee on winning payouts.
 */
export async function calculatePlatformRevenue(
  marketId: number,
  winningOutcome: "YES" | "NO",
  feePercentage: number = 2.0 // Default 2% fee
): Promise<{
  totalVolume: number;
  grossPayouts: number;
  platformFee: number;
  netPayouts: number;
  feePercentage: number;
}> {
  const state = await getMarketState(marketId);

  const totalVolume = state.volume;
  const grossPayouts = winningOutcome === "YES" ? state.sharesYes : state.sharesNo;
  const platformFee = grossPayouts * (feePercentage / 100);
  const netPayouts = grossPayouts - platformFee;

  return {
    totalVolume,
    grossPayouts,
    platformFee,
    netPayouts,
    feePercentage,
  };
}

/**
 * Recommend related markets based on trading behavior.
 *
 * Uses collaborative filtering on user prediction patterns.
 */
export async function getRecommendedMarkets(
  userId: number,
  limit: number = 5
): Promise<Array<{
  marketId: number;
  relevanceScore: number;
  reason: string;
}>> {
  // Get user's prediction history
  const userPreds = await db
    .select()
    .from(predictions)
    .where(eq(predictions.userId, userId))
    .orderBy(predictions.createdAt);

  if (userPreds.length === 0) {
    return [];
  }

  // Get categories user has predicted in
  const userMarketIds = userPreds.map(p => p.marketId);
  const userMarkets = await db
    .select()
    .from(markets)
    .where(eq(markets.status, "OPEN"));

  const categoryCount = new Map<string, number>();
  for (const market of userMarkets) {
    if (userMarketIds.includes(market.id)) {
      categoryCount.set(market.category, (categoryCount.get(market.category) || 0) + 1);
    }
  }

  // Find markets in those categories user hasn't predicted in yet
  const recommendations = [];
  for (const market of userMarkets) {
    if (userMarketIds.includes(market.id)) continue;

    const relevance = categoryCount.get(market.category) || 0;
    if (relevance > 0) {
      recommendations.push({
        marketId: market.id,
        relevanceScore: relevance,
        reason: `You've predicted ${relevance} times in ${market.category}`,
      });
    }
  }

  return recommendations
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit);
}
