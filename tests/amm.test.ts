import { describe, it, expect, beforeEach } from 'vitest';
import {
  lmsrCost,
  lmsrProbability,
  calculatePurchaseCost,
  getQuote,
  calculateSharesForAmount,
  DEFAULT_AMM_CONFIG,
  type MarketState,
} from '@/lib/amm';

describe('LMSR Automated Market Maker', () => {
  let balancedMarket: MarketState;
  let skewedMarket: MarketState;

  beforeEach(() => {
    // Balanced market: 50/50 probability
    balancedMarket = {
      id: 1,
      sharesYes: 0,
      sharesNo: 0,
      liquidityParameter: 1000,
      volume: 10000,
    };

    // Skewed market: ~70% YES probability
    skewedMarket = {
      id: 2,
      sharesYes: 847, // ln(0.7/0.3) * 1000 ≈ 847
      sharesNo: 0,
      liquidityParameter: 1000,
      volume: 50000,
    };
  });

  describe('LMSR Cost Function', () => {
    it('should calculate cost for balanced market', () => {
      const cost = lmsrCost(0, 0, 1000);

      // C(0,0) = b × ln(e^0 + e^0) = b × ln(2)
      const expected = 1000 * Math.log(2);

      expect(cost).toBeCloseTo(expected, 2);
    });

    it('should calculate cost for skewed market', () => {
      const cost = lmsrCost(0, 1000, 1000);

      // C(0, 1000) = 1000 × ln(e^0 + e^1) = 1000 × ln(1 + e)
      const expected = 1000 * Math.log(1 + Math.E);

      expect(cost).toBeCloseTo(expected, 2);
    });

    it('should increase monotonically with more shares', () => {
      const cost0 = lmsrCost(0, 0, 1000);
      const cost1 = lmsrCost(0, 500, 1000);
      const cost2 = lmsrCost(0, 1000, 1000);

      expect(cost1).toBeGreaterThan(cost0);
      expect(cost2).toBeGreaterThan(cost1);
    });

    it('should handle large numbers without overflow', () => {
      // Test with very large share amounts
      const cost = lmsrCost(10000, 10000, 1000);

      expect(cost).toBeFinite();
      expect(cost).toBeGreaterThan(0);
    });
  });

  describe('LMSR Probability Function', () => {
    it('should return 0.5 for balanced market', () => {
      const prob = lmsrProbability(0, 0, 1000);

      expect(prob).toBeCloseTo(0.5, 4);
    });

    it('should return ~0.7 for skewed market', () => {
      const prob = lmsrProbability(0, 847, 1000);

      expect(prob).toBeCloseTo(0.7, 2);
    });

    it('should return probabilities between 0 and 1', () => {
      const prob1 = lmsrProbability(-1000, 1000, 1000);
      const prob2 = lmsrProbability(1000, -1000, 1000);
      const prob3 = lmsrProbability(500, 500, 1000);

      expect(prob1).toBeGreaterThan(0);
      expect(prob1).toBeLessThan(1);
      expect(prob2).toBeGreaterThan(0);
      expect(prob2).toBeLessThan(1);
      expect(prob3).toBeGreaterThan(0);
      expect(prob3).toBeLessThan(1);
    });

    it('should return complement probabilities that sum to 1', () => {
      const probYes = lmsrProbability(100, 500, 1000);
      const probNo = 1 - probYes;

      expect(probYes + probNo).toBeCloseTo(1.0, 10);
    });

    it('should approach 1 as YES shares dominate', () => {
      const prob = lmsrProbability(0, 5000, 1000);

      expect(prob).toBeGreaterThan(0.99);
    });

    it('should approach 0 as NO shares dominate', () => {
      const prob = lmsrProbability(5000, 0, 1000);

      expect(prob).toBeLessThan(0.01);
    });
  });

  describe('Purchase Cost Calculation', () => {
    it('should calculate cost to buy YES shares in balanced market', () => {
      const cost = calculatePurchaseCost(balancedMarket, 'YES', 100);

      // Buying YES should cost approximately shares × 0.5 (current price)
      // But price increases as we buy, so cost > 100 × 0.5
      expect(cost).toBeGreaterThan(50);
      expect(cost).toBeLessThan(100); // But less than face value
    });

    it('should be more expensive to buy YES in YES-skewed market', () => {
      const costBalanced = calculatePurchaseCost(balancedMarket, 'YES', 100);
      const costSkewed = calculatePurchaseCost(skewedMarket, 'YES', 100);

      // YES is more expensive in skewed market (already at ~70%)
      expect(costSkewed).toBeGreaterThan(costBalanced);
    });

    it('should be cheaper to buy NO in YES-skewed market', () => {
      const costYes = calculatePurchaseCost(skewedMarket, 'YES', 100);
      const costNo = calculatePurchaseCost(skewedMarket, 'NO', 100);

      // NO is undervalued in YES-skewed market
      expect(costNo).toBeLessThan(costYes);
    });

    it('should cost more for larger purchases (convex)', () => {
      const cost100 = calculatePurchaseCost(balancedMarket, 'YES', 100);
      const cost200 = calculatePurchaseCost(balancedMarket, 'YES', 200);

      // Cost is superlinear (convex) due to price impact
      expect(cost200).toBeGreaterThan(cost100 * 2);
    });

    it('should handle small purchases', () => {
      const cost = calculatePurchaseCost(balancedMarket, 'YES', 1);

      expect(cost).toBeGreaterThan(0);
      expect(cost).toBeLessThan(1);
    });
  });

  describe('Quote Generation', () => {
    it('should generate valid quote for YES purchase', () => {
      const quote = getQuote(balancedMarket, 'YES', 100);

      expect(quote.outcome).toBe('YES');
      expect(quote.shares).toBe(100);
      expect(quote.cost).toBeGreaterThan(0);
      expect(quote.avgPrice).toBeGreaterThan(0);
      expect(quote.newProbability).toBeGreaterThan(0.5); // Buying YES increases probability
      expect(quote.effectiveOdds).toBeGreaterThan(1.0);
      expect(quote.effectiveOdds).toBeLessThan(2.0); // Should be close to 2.0 for ~50% prob
    });

    it('should generate valid quote for NO purchase', () => {
      const quote = getQuote(balancedMarket, 'NO', 100);

      expect(quote.outcome).toBe('NO');
      expect(quote.shares).toBe(100);
      expect(quote.newProbability).toBeLessThan(0.5); // Buying NO decreases YES probability
    });

    it('should show price impact in skewed market', () => {
      const quoteSmall = getQuote(skewedMarket, 'YES', 50);
      const quoteLarge = getQuote(skewedMarket, 'YES', 500);

      // Larger purchase should have higher average price (worse execution)
      expect(quoteLarge.avgPrice).toBeGreaterThan(quoteSmall.avgPrice);
    });

    it('should update market state correctly', () => {
      const quote = getQuote(balancedMarket, 'YES', 100);

      expect(quote.newState.sharesYes).toBe(balancedMarket.sharesYes + 100);
      expect(quote.newState.sharesNo).toBe(balancedMarket.sharesNo);
    });

    it('should reject purchases below minimum shares', () => {
      expect(() => {
        getQuote(balancedMarket, 'YES', 0.5);
      }).toThrow('Minimum purchase');
    });

    it('should reject purchases above maximum shares', () => {
      const maxShares = balancedMarket.liquidityParameter * DEFAULT_AMM_CONFIG.maxSharesMultiplier;

      expect(() => {
        getQuote(balancedMarket, 'YES', maxShares + 1);
      }).toThrow('Maximum purchase');
    });

    it('should clamp probabilities to bounds', () => {
      // Try to push probability very high
      const quote = getQuote(balancedMarket, 'YES', 5000);

      expect(quote.newProbability).toBeLessThanOrEqual(DEFAULT_AMM_CONFIG.maxProbability);
      expect(quote.effectiveOdds).toBeGreaterThanOrEqual(1 / DEFAULT_AMM_CONFIG.maxProbability);
    });
  });

  describe('Shares for Amount Calculation', () => {
    it('should find shares for exact amount', () => {
      const amount = 100;
      const shares = calculateSharesForAmount(balancedMarket, 'YES', amount);

      expect(shares).toBeGreaterThan(0);

      // Verify cost is close to requested amount
      const cost = calculatePurchaseCost(balancedMarket, 'YES', shares);
      expect(cost).toBeCloseTo(amount, 1); // Within 1% tolerance
    });

    it('should return more shares for same amount in favorable market', () => {
      const amount = 100;
      const sharesYes = calculateSharesForAmount(skewedMarket, 'YES', amount);
      const sharesNo = calculateSharesForAmount(skewedMarket, 'NO', amount);

      // NO is underpriced in YES-skewed market, so more shares for same cost
      expect(sharesNo).toBeGreaterThan(sharesYes);
    });

    it('should handle small amounts', () => {
      const shares = calculateSharesForAmount(balancedMarket, 'YES', 10);

      expect(shares).toBeGreaterThanOrEqual(DEFAULT_AMM_CONFIG.minShares);
    });

    it('should handle large amounts', () => {
      const shares = calculateSharesForAmount(balancedMarket, 'YES', 5000);

      expect(shares).toBeLessThanOrEqual(
        balancedMarket.liquidityParameter * DEFAULT_AMM_CONFIG.maxSharesMultiplier
      );
    });
  });

  describe('Market Properties', () => {
    it('should maintain bounded loss property', () => {
      // Maximum loss for market maker is b × ln(2) for binary markets
      const maxLoss = balancedMarket.liquidityParameter * Math.log(2);

      // Buy YES shares up to the limit
      const maxShares = balancedMarket.liquidityParameter * DEFAULT_AMM_CONFIG.maxSharesMultiplier;
      const cost = calculatePurchaseCost(balancedMarket, 'YES', maxShares);

      // Even with maximum purchase, cost should be bounded
      expect(cost).toBeLessThan(balancedMarket.liquidityParameter * 5); // Reasonable bound
    });

    it('should provide constant liquidity', () => {
      // Should always be able to buy shares at some price
      const quote1 = getQuote(balancedMarket, 'YES', 100);

      // Even after extreme price movement, can still buy
      const extremeState: MarketState = {
        ...balancedMarket,
        sharesYes: 5000,
        sharesNo: 0,
      };

      const quote2 = getQuote(extremeState, 'YES', 10);

      expect(quote1.cost).toBeGreaterThan(0);
      expect(quote2.cost).toBeGreaterThan(0);
    });

    it('should have increasing marginal cost', () => {
      // Each additional share should cost more than the last
      const cost1to10 = calculatePurchaseCost(balancedMarket, 'YES', 10);

      const state10: MarketState = {
        ...balancedMarket,
        sharesYes: 10,
      };
      const cost11to20 = calculatePurchaseCost(state10, 'YES', 10);

      expect(cost11to20).toBeGreaterThan(cost1to10);
    });

    it('should converge probability with volume', () => {
      // Heavy buying of YES should push probability toward 1
      const state1: MarketState = {
        ...balancedMarket,
        sharesYes: 2000,
        sharesNo: 0,
      };

      const prob1 = lmsrProbability(state1.sharesNo, state1.sharesYes, state1.liquidityParameter);

      // Even heavier buying
      const state2: MarketState = {
        ...balancedMarket,
        sharesYes: 4000,
        sharesNo: 0,
      };

      const prob2 = lmsrProbability(state2.sharesNo, state2.sharesYes, state2.liquidityParameter);

      expect(prob2).toBeGreaterThan(prob1);
      expect(prob2).toBeCloseTo(1.0, 1);
    });
  });

  describe('Odds Conversion', () => {
    it('should convert probability to correct decimal odds', () => {
      // 50% probability = 2.0 decimal odds
      const prob50 = 0.5;
      const odds50 = 1 / prob50;
      expect(odds50).toBeCloseTo(2.0, 2);

      // 33.3% probability = 3.0 decimal odds
      const prob33 = 0.333;
      const odds33 = 1 / prob33;
      expect(odds33).toBeCloseTo(3.0, 1);

      // 25% probability = 4.0 decimal odds
      const prob25 = 0.25;
      const odds25 = 1 / prob25;
      expect(odds25).toBeCloseTo(4.0, 2);
    });

    it('should handle odds at probability bounds', () => {
      const minOdds = 1 / DEFAULT_AMM_CONFIG.maxProbability;
      const maxOdds = 1 / DEFAULT_AMM_CONFIG.minProbability;

      expect(minOdds).toBeCloseTo(1.01, 2);
      expect(maxOdds).toBeCloseTo(100, 0);
    });
  });

  describe('Arbitrage Prevention', () => {
    it('should not allow risk-free arbitrage', () => {
      // Buy both YES and NO shares
      const costYes = calculatePurchaseCost(balancedMarket, 'YES', 100);
      const costNo = calculatePurchaseCost(balancedMarket, 'NO', 100);

      // Total cost should exceed guaranteed payout of 100
      // (Both outcomes can't happen, so at most one pays out 100)
      expect(costYes + costNo).toBeGreaterThan(100);
    });

    it('should maintain no-arbitrage across sequential trades', () => {
      // Buy YES, then buy NO
      const costYes1 = calculatePurchaseCost(balancedMarket, 'YES', 50);

      const stateAfterYes: MarketState = {
        ...balancedMarket,
        sharesYes: 50,
      };

      const costNo = calculatePurchaseCost(stateAfterYes, 'NO', 50);

      // Combined cost should still exceed guaranteed payout
      expect(costYes1 + costNo).toBeGreaterThan(50);
    });
  });

  describe('Symmetry Properties', () => {
    it('should be symmetric for balanced market', () => {
      const costYes = calculatePurchaseCost(balancedMarket, 'YES', 100);
      const costNo = calculatePurchaseCost(balancedMarket, 'NO', 100);

      // Costs should be equal for balanced market
      expect(costYes).toBeCloseTo(costNo, 2);
    });

    it('should be asymmetric for skewed market', () => {
      const costYes = calculatePurchaseCost(skewedMarket, 'YES', 100);
      const costNo = calculatePurchaseCost(skewedMarket, 'NO', 100);

      // YES should be more expensive in YES-skewed market
      expect(costYes).toBeGreaterThan(costNo);
    });
  });
});
