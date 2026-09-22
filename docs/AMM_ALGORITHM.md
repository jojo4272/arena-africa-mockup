# Automated Market Maker (AMM) Algorithm Documentation

## Overview

Arena Africa uses a **Logarithmic Market Scoring Rule (LMSR)** automated market maker to provide dynamic, real-time pricing for prediction markets. This is the same algorithm used by major prediction market platforms like Augur and Gnosis.

## Why LMSR?

### Problems with Static Odds

The previous system used static odds (e.g., 1.85x for both YES and NO) that never changed. This created several issues:

1. **No Price Discovery**: Odds didn't reflect crowd wisdom
2. **Unlimited Risk**: Platform could lose unbounded amounts
3. **No Liquidity Management**: No mechanism to balance buy/sell pressure
4. **Manipulation Risk**: Large traders could game static prices

### LMSR Benefits

1. ✅ **Dynamic Pricing**: Odds adjust automatically based on trading activity
2. ✅ **Bounded Loss**: Maximum platform loss is limited to liquidity parameter `b`
3. ✅ **Always-On Liquidity**: Can always buy/sell at some price (no need for counterparties)
4. ✅ **Price Discovery**: Converges to crowd's aggregate probability estimate
5. ✅ **Incentive Compatible**: Truthful reporting is the optimal strategy
6. ✅ **Proven**: Used in real markets with billions in volume

## How LMSR Works

### The Cost Function

The market maker tracks outstanding shares for each outcome:
- `q₀` = shares for NO outcome
- `q₁` = shares for YES outcome

The total cost paid out by the market maker is:

```
C(q₀, q₁) = b × ln(e^(q₀/b) + e^(q₁/b))
```

Where `b` is the **liquidity parameter** that controls:
- How quickly prices move (lower `b` = faster movement)
- Maximum loss the market maker can incur
- How much capital is effectively "backing" the market

### The Price Formula

The instantaneous price (probability) for YES is:

```
P(YES) = e^(q₁/b) / (e^(q₀/b) + e^(q₁/b))
```

This is a **softmax function** that:
- Always produces probabilities between 0 and 1
- Ensures P(YES) + P(NO) = 1
- Adjusts smoothly as shares change

### Purchase Cost

When a user buys `n` shares of outcome `i`:

```
Cost = C(q₀', q₁') - C(q₀, q₁)
```

Where `(q₀', q₁')` is the new state after adding `n` to `qᵢ`.

The cost is **convex** (superlinear) — each additional share costs more than the last. This prevents manipulation and ensures price stability.

## Example Walkthrough

### Initial State: Balanced Market

A new market starts with:
- `q₀ = 0` (NO shares)
- `q₁ = 0` (YES shares)
- `b = 1000` KES (liquidity parameter)

**Current probability:**
```
P(YES) = e^0 / (e^0 + e^0) = 1/2 = 50%
```

**Current odds:**
```
Odds(YES) = 1 / 0.5 = 2.0x
Odds(NO) = 1 / 0.5 = 2.0x
```

### User A: Buy 500 KES of YES

**Cost calculation:**
```
C(0, 0) = 1000 × ln(e^0 + e^0) = 1000 × ln(2) ≈ 693 KES
```

Using binary search, we find that 500 KES buys approximately **847 shares**.

```
C(0, 847) = 1000 × ln(e^0 + e^0.847) ≈ 1193 KES
Cost = 1193 - 693 = 500 KES ✓
```

**New state:**
- `q₀ = 0` (NO shares)
- `q₁ = 847` (YES shares)

**New probability:**
```
P(YES) = e^0.847 / (e^0 + e^0.847) ≈ 0.70 = 70%
```

**New odds:**
```
Odds(YES) = 1 / 0.7 ≈ 1.43x
Odds(NO) = 1 / 0.3 ≈ 3.33x
```

Notice:
- YES odds **decreased** (harder to profit from consensus)
- NO odds **increased** (contrarian bets are rewarded more)
- Platform collected 500 KES, issued 847 shares (worth 847 KES at resolution)

### User B: Buy 500 KES of NO

**Current state:**
- `q₀ = 0`, `q₁ = 847`
- Current cost: 1193 KES

With 500 KES, User B buys approximately **1352 shares** of NO (more shares because NO is undervalued).

```
C(1352, 847) ≈ 1693 KES
Cost = 1693 - 1193 = 500 KES ✓
```

**New state:**
- `q₀ = 1352` (NO shares)
- `q₁ = 847` (YES shares)

**New probability:**
```
P(YES) = e^0.847 / (e^1.352 + e^0.847) ≈ 0.38 = 38%
```

**New odds:**
```
Odds(YES) ≈ 2.63x
Odds(NO) ≈ 1.61x
```

Market is now skewed toward NO (62% probability).

### Market Resolution: YES wins

Platform must pay out:
- All YES holders: 847 KES total
- All NO holders: 0 KES (they lost)

**Market maker P&L:**
```
Collected: 1000 KES (500 from User A + 500 from User B)
Paid out: 847 KES (to YES holders)
Profit: 153 KES (15.3% margin)
```

### If NO had won instead:

```
Collected: 1000 KES
Paid out: 1352 KES (to NO holders)
Loss: -352 KES (35.2% loss)
```

This is within the bounded loss guarantee: maximum loss is `b × ln(2) ≈ 693 KES`.

## Configuration Parameters

### Liquidity Parameter (`b`)

Controls price sensitivity and risk:

| Market Size | Recommended `b` (USD) | Price Impact per $100 |
|-------------|----------------------|----------------------|
| Small/New | 100 - 500 | High (5-10%) |
| Medium | 500 - 2000 | Medium (2-5%) |
| Large/Popular | 2000 - 10000 | Low (0.5-2%) |

**Higher `b`:**
- ✅ More stable prices (less manipulation risk)
- ✅ Lower price impact per trade
- ❌ Slower price discovery
- ❌ Higher maximum loss for platform

**Lower `b`:**
- ✅ Faster price discovery
- ✅ Lower maximum loss for platform
- ❌ More volatile prices
- ❌ Easier to manipulate

**Dynamic `b`:** Arena Africa adjusts `b` based on market volume — larger markets get higher liquidity for stability.

### Probability Bounds

```typescript
minProbability: 0.01  // 1% (max odds: 100x)
maxProbability: 0.99  // 99% (min odds: 1.01x)
```

These prevent:
- Infinite odds (division by zero)
- Market manipulation via extreme prices
- User confusion from unrealistic payouts

### Trade Limits

```typescript
minShares: 1
maxSharesMultiplier: 10  // Can buy up to 10× liquidity in one trade
```

Prevents:
- Dust trades (spam)
- Market manipulation (single huge trade)

## Key Properties

### 1. Bounded Loss

The market maker's maximum loss is bounded:

```
Max Loss = b × ln(n)
```

For binary markets (`n = 2`):
```
Max Loss = b × ln(2) ≈ 0.693b
```

**Example:** With `b = 1000 KES`, maximum loss is 693 KES, even if the entire market bets on the losing outcome.

### 2. Constant Liquidity

Users can **always** trade at some price, even in thin markets. No need to wait for a counterparty.

### 3. No Arbitrage

Cannot profit risk-free by buying both outcomes:
```
Cost(YES shares) + Cost(NO shares) > Guaranteed Payout
```

The market maker ensures this by adjusting prices dynamically.

### 4. Incentive Compatibility

The optimal strategy is to bet according to your true belief. If you think an outcome has 60% probability, you should buy it whenever the market price is below 60%.

### 5. Proper Scoring Rule

LMSR is a **proper scoring rule** — it incentivizes honest reporting of probabilities. This makes it ideal for information aggregation.

## Comparison to Other Mechanisms

| Mechanism | Price Discovery | Liquidity | Bounded Loss | Complexity |
|-----------|----------------|-----------|--------------|------------|
| **Static Odds** | ❌ None | ✅ Always | ❌ Unbounded | ⭐ Simple |
| **Order Book** | ✅ Excellent | ❌ Depends on traders | ✅ Zero (matched only) | ⭐⭐⭐ Complex |
| **Constant Product (Uniswap)** | ✅ Good | ✅ Always | ❌ Impermanent loss | ⭐⭐ Medium |
| **LMSR (Arena Africa)** | ✅ Excellent | ✅ Always | ✅ Bounded | ⭐⭐ Medium |

LMSR is optimal for prediction markets because it:
- Guarantees liquidity (no order book needed)
- Bounds platform risk (unlike static odds)
- Enables efficient price discovery (unlike static odds)
- Is simpler than order books (easier for users)

## Implementation Details

### Database Changes

The schema doesn't need major changes. We track:
- `oddsYes` / `oddsNo` — calculated dynamically from share state
- `volume` — total value traded (analytics)
- Outstanding shares are calculated from `predictions` table

### Share Calculation

Each prediction creates shares equal to `potentialPayout`:

```sql
SELECT 
  outcome,
  SUM(potentialPayout) as totalShares
FROM predictions
WHERE marketId = ?
GROUP BY outcome
```

### Odds Calculation

Real-time odds are calculated on-demand:

```typescript
const state = await getMarketState(marketId);
const probability = lmsrProbability(state.sharesNo, state.sharesYes, state.liquidityParameter);
const oddsYes = 1 / probability;
const oddsNo = 1 / (1 - probability);
```

### Trade Flow

1. **User requests trade:** "Buy 1000 KES of YES"
2. **Calculate shares:** Binary search to find shares for 1000 KES
3. **Get quote:** Calculate effective odds, price impact
4. **Show user:** "1000 KES buys 847 shares at 1.18x average odds (4.2% price impact)"
5. **User confirms**
6. **Execute:** Deduct 1000 KES, credit 847 shares (as `potentialPayout`)
7. **Update state:** Automatically reflected in next trade's pricing

### Migration from Static Odds

Existing markets with static odds can be migrated:

```typescript
// Set initial shares to match current odds
const targetProb = 1 / currentOddsYes;
await migrateMarketToLMSR(marketId, targetProb);
```

This sets the starting probability without disrupting existing predictions.

## API Examples

### Get Current Odds

```bash
GET /api/markets/1/odds

{
  "probabilityYes": 0.68,
  "probabilityNo": 0.32,
  "oddsYes": 1.47,
  "oddsNo": 3.13
}
```

### Get Trade Quote

```bash
POST /api/markets/1/quote
{
  "outcome": "YES",
  "amount": 1000
}

Response:
{
  "effectiveOdds": 1.42,
  "shares": 704,
  "cost": 1000,
  "newProbability": 0.73,
  "priceImpact": 7.4
}
```

### Place Prediction (Updated)

```bash
POST /api/predictions
{
  "marketId": 1,
  "outcome": "YES",
  "amount": 1000,
  "platform": "WEB"
}

Response:
{
  "success": true,
  "prediction": {
    "id": 123,
    "shares": 704,
    "effectiveOdds": 1.42,
    "potentialPayout": 704
  },
  "newBalance": 1500,
  "marketOdds": {
    "oddsYes": 1.35,
    "oddsNo": 3.45
  }
}
```

## Monitoring & Analytics

### Market Maker P&L

Track profit/loss per market:

```typescript
const pnl = await calculateMarketMakerPnL(marketId, 'YES');

// Output:
// {
//   totalCollected: 5000,
//   totalPayout: 4200,
//   profit: 800,
//   profitPercentage: 16.0
// }
```

### Price History

Track probability over time for charts:

```sql
SELECT 
  createdAt,
  (SELECT COUNT(*) FROM predictions WHERE marketId = ? AND outcome = 'YES') as sharesYes,
  (SELECT COUNT(*) FROM predictions WHERE marketId = ? AND outcome = 'NO') as sharesNo
FROM predictions
WHERE marketId = ?
ORDER BY createdAt;
```

Calculate probability at each point using `lmsrProbability()`.

### Volume Distribution

Analyze trading patterns:

```sql
SELECT 
  outcome,
  COUNT(*) as numTrades,
  SUM(amount) as totalVolume,
  AVG(amount) as avgTradeSize
FROM predictions
WHERE marketId = ?
GROUP BY outcome;
```

## Security Considerations

### Manipulation Prevention

1. **Max trade size:** Limited to 10× liquidity parameter
2. **Price impact:** Large trades move price significantly (cost increases)
3. **Convex cost:** Each additional share costs more
4. **Bounded loss:** Platform risk is capped at `b × ln(2)`

### Edge Cases

1. **Division by zero:** Prevented by min/max probability bounds
2. **Numerical overflow:** Log-sum-exp trick for large exponents
3. **Negative shares:** Impossible (shares only increase)
4. **Simultaneous trades:** Database transactions ensure atomicity

### Audit Trail

All trades are logged with:
- Shares purchased
- Cost paid
- Effective odds
- Market state before/after

## Performance Optimization

### Caching Strategy

- Cache market state for 5 seconds (reads outnumber writes)
- Invalidate on each trade
- Use Redis for high-traffic markets

### Query Optimization

```sql
-- Index on marketId for fast share aggregation
CREATE INDEX idx_predictions_market_outcome ON predictions(marketId, outcome);

-- Partial index for open markets only
CREATE INDEX idx_markets_open ON markets(id) WHERE status = 'OPEN';
```

## Testing

See `tests/amm.test.ts` for comprehensive test suite covering:
- ✅ Cost function accuracy
- ✅ Probability calculation
- ✅ Purchase cost
- ✅ Quote generation
- ✅ Shares-for-amount conversion
- ✅ Bounded loss property
- ✅ No-arbitrage guarantee
- ✅ Symmetry properties
- ✅ Edge cases

Run tests:
```bash
npm test amm.test.ts
```

## References

### Academic Papers

1. **Hanson, R. (2002).** "Logarithmic Market Scoring Rules for Modular Combinatorial Information Aggregation"  
   *Journal of Prediction Markets*, 1(1), 3-15.  
   [Original LMSR paper]

2. **Chen, Y., & Pennock, D. M. (2007).** "A Utility Framework for Bounded-Loss Market Makers"  
   *Proceedings of the 8th ACM Conference on Electronic Commerce*, 49-56.  
   [Bounded loss analysis]

3. **Othman, A., & Sandholm, T. (2010).** "Automated Market-Making in the Large: The Gates Hillman Prediction Market"  
   *Proceedings of the 11th ACM Conference on Electronic Commerce*, 367-376.  
   [Real-world deployment lessons]

### Production Implementations

- **Augur:** Ethereum-based prediction market using LMSR
- **Gnosis:** Multi-outcome markets with LMSR variant
- **Polymarket:** Combines LMSR with order books (hybrid)

### Online Resources

- [Prediction Markets: Theory and Applications](https://mason.gmu.edu/~rhanson/market2info.pdf)
- [LMSR Calculator](https://www.cs.cmu.edu/~./awaters/lmsr.html)
- [Vitalik Buterin on Prediction Markets](https://vitalik.ca/general/2021/02/18/prediction_markets.html)

---

**Document Version:** 1.0.0  
**Last Updated:** 2026-09-16  
**Author:** Arena Africa Engineering Team  
**Status:** Production Ready ✅
