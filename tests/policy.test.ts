import { describe, it, expect } from 'vitest';
import { evaluatePolicy, toUsd, KYC_LIMITS, RESTRICTED_COUNTRIES } from '@/lib/policy';
import type { PolicyContext } from '@/lib/policy';

describe('Policy Engine', () => {
  describe('Currency Conversion', () => {
    it('should convert KES to USD correctly', () => {
      const amountKes = 1000;
      const usd = toUsd(amountKes, 'KES');

      expect(usd).toBeCloseTo(7.7, 1);
    });

    it('should convert multiple currencies to USD', () => {
      expect(toUsd(1000, 'NGN')).toBeCloseTo(0.65, 1);
      expect(toUsd(1000, 'UGX')).toBeCloseTo(0.26, 1);
      expect(toUsd(1000, 'ZAR')).toBeCloseTo(55, 1);
    });

    it('should handle USD pass-through', () => {
      expect(toUsd(100, 'USD')).toBe(100);
    });

    it('should handle unknown currency with KES fallback', () => {
      const result = toUsd(1000, 'UNKNOWN');
      expect(result).toBeCloseTo(7.7, 1);
    });
  });

  describe('KYC Limits', () => {
    it('should have correct tier limits', () => {
      expect(KYC_LIMITS.NONE.perTxUsd).toBe(20);
      expect(KYC_LIMITS.NONE.dailyUsd).toBe(50);

      expect(KYC_LIMITS.BASIC.perTxUsd).toBe(200);
      expect(KYC_LIMITS.BASIC.dailyUsd).toBe(500);

      expect(KYC_LIMITS.VERIFIED.perTxUsd).toBe(2000);
      expect(KYC_LIMITS.ENHANCED.perTxUsd).toBe(25000);
    });
  });

  describe('Jurisdiction Restrictions', () => {
    it('should block restricted countries', () => {
      expect(RESTRICTED_COUNTRIES.has('US')).toBe(true);
      expect(RESTRICTED_COUNTRIES.has('FR')).toBe(true);
    });

    it('should allow African countries', () => {
      expect(RESTRICTED_COUNTRIES.has('KE')).toBe(false);
      expect(RESTRICTED_COUNTRIES.has('NG')).toBe(false);
      expect(RESTRICTED_COUNTRIES.has('ZA')).toBe(false);
    });
  });

  describe('Policy Evaluation - RBAC', () => {
    it('should allow MEMBER to place predictions', () => {
      const ctx: PolicyContext = {
        action: 'predict:create',
        subject: {
          userId: 1,
          role: 'MEMBER',
          status: 'ACTIVE',
          kycTier: 'BASIC',
          countryCode: 'KE',
          currency: 'KES',
          balance: 10000,
        },
        resource: {
          type: 'market',
          id: 1,
          status: 'OPEN',
        },
        amount: 500,
        dailySpend: 1000,
        channel: 'WEB',
      };

      const decision = evaluatePolicy(ctx);

      expect(decision.effect).toBe('ALLOW');
      expect(decision.allowed).toBe(true);
    });

    it('should deny GUEST from placing predictions', () => {
      const ctx: PolicyContext = {
        action: 'predict:create',
        subject: {
          role: 'GUEST',
          status: 'ACTIVE',
        },
        channel: 'WEB',
      };

      const decision = evaluatePolicy(ctx);

      expect(decision.effect).toBe('DENY');
      expect(decision.allowed).toBe(false);
      expect(decision.codes).toContain('RBAC_DENIED');
    });
  });

  describe('Policy Evaluation - Account Status', () => {
    it('should deny SUSPENDED accounts', () => {
      const ctx: PolicyContext = {
        action: 'predict:create',
        subject: {
          userId: 2,
          role: 'MEMBER',
          status: 'SUSPENDED',
          kycTier: 'BASIC',
          countryCode: 'KE',
        },
        channel: 'WEB',
      };

      const decision = evaluatePolicy(ctx);

      expect(decision.effect).toBe('DENY');
      expect(decision.codes).toContain('ACCOUNT_SUSPENDED');
    });

    it('should deny CLOSED accounts', () => {
      const ctx: PolicyContext = {
        action: 'wallet:withdraw',
        subject: {
          userId: 3,
          role: 'MEMBER',
          status: 'CLOSED',
          kycTier: 'BASIC',
        },
        channel: 'WEB',
      };

      const decision = evaluatePolicy(ctx);

      expect(decision.effect).toBe('DENY');
      expect(decision.codes).toContain('ACCOUNT_CLOSED');
    });
  });

  describe('Policy Evaluation - KYC Limits', () => {
    it('should deny transaction exceeding BASIC tier limit', () => {
      const ctx: PolicyContext = {
        action: 'predict:create',
        subject: {
          userId: 4,
          role: 'MEMBER',
          status: 'ACTIVE',
          kycTier: 'BASIC',
          countryCode: 'KE',
          currency: 'KES',
          balance: 100000,
        },
        amount: 30000, // ~231 USD, exceeds BASIC 200 USD limit
        dailySpend: 0,
        channel: 'WEB',
      };

      const decision = evaluatePolicy(ctx);

      expect(decision.effect).toBe('DENY');
      expect(decision.codes).toContain('KYC_LIMIT_PER_TX');
    });

    it('should deny transaction exceeding daily velocity', () => {
      const ctx: PolicyContext = {
        action: 'predict:create',
        subject: {
          userId: 5,
          role: 'MEMBER',
          status: 'ACTIVE',
          kycTier: 'BASIC',
          countryCode: 'NG',
          currency: 'NGN',
          balance: 500000,
        },
        amount: 50000, // ~32.5 USD
        dailySpend: 700000, // ~455 USD already spent, total would exceed 500 USD daily
        channel: 'WEB',
      };

      const decision = evaluatePolicy(ctx);

      expect(decision.effect).toBe('DENY');
      expect(decision.codes).toContain('KYC_LIMIT_DAILY');
    });

    it('should allow VERIFIED tier higher limits', () => {
      const ctx: PolicyContext = {
        action: 'wallet:deposit',
        subject: {
          userId: 6,
          role: 'MEMBER',
          status: 'ACTIVE',
          kycTier: 'VERIFIED',
          countryCode: 'ZA',
          currency: 'ZAR',
          balance: 10000,
        },
        amount: 20000, // ~1100 USD, within VERIFIED 2000 USD limit
        dailySpend: 5000,
        channel: 'WEB',
      };

      const decision = evaluatePolicy(ctx);

      expect(decision.effect).toBe('ALLOW');
      expect(decision.allowed).toBe(true);
    });
  });

  describe('Policy Evaluation - Jurisdiction', () => {
    it('should deny US users', () => {
      const ctx: PolicyContext = {
        action: 'predict:create',
        subject: {
          userId: 7,
          role: 'MEMBER',
          status: 'ACTIVE',
          kycTier: 'BASIC',
          countryCode: 'US',
          currency: 'USD',
          balance: 1000,
        },
        amount: 10,
        channel: 'WEB',
      };

      const decision = evaluatePolicy(ctx);

      expect(decision.effect).toBe('DENY');
      expect(decision.codes).toContain('JURISDICTION_BLOCKED');
    });

    it('should deny French users', () => {
      const ctx: PolicyContext = {
        action: 'wallet:deposit',
        subject: {
          userId: 8,
          role: 'MEMBER',
          status: 'ACTIVE',
          kycTier: 'VERIFIED',
          countryCode: 'FR',
          currency: 'EUR',
        },
        channel: 'WEB',
      };

      const decision = evaluatePolicy(ctx);

      expect(decision.effect).toBe('DENY');
      expect(decision.codes).toContain('JURISDICTION_BLOCKED');
    });
  });

  describe('Policy Evaluation - Sufficient Funds', () => {
    it('should deny prediction without sufficient balance', () => {
      const ctx: PolicyContext = {
        action: 'predict:create',
        subject: {
          userId: 9,
          role: 'MEMBER',
          status: 'ACTIVE',
          kycTier: 'BASIC',
          countryCode: 'UG',
          currency: 'UGX',
          balance: 1000,
        },
        amount: 5000, // More than balance
        dailySpend: 0,
        channel: 'USSD',
      };

      const decision = evaluatePolicy(ctx);

      expect(decision.effect).toBe('DENY');
      expect(decision.codes).toContain('INSUFFICIENT_FUNDS');
    });
  });

  describe('Policy Evaluation - Market Status', () => {
    it('should deny prediction on RESOLVED market', () => {
      const ctx: PolicyContext = {
        action: 'predict:create',
        subject: {
          userId: 10,
          role: 'MEMBER',
          status: 'ACTIVE',
          kycTier: 'BASIC',
          countryCode: 'KE',
          currency: 'KES',
          balance: 10000,
        },
        resource: {
          type: 'market',
          id: 5,
          status: 'RESOLVED',
        },
        amount: 500,
        dailySpend: 0,
        channel: 'WEB',
      };

      const decision = evaluatePolicy(ctx);

      expect(decision.effect).toBe('DENY');
      expect(decision.codes).toContain('MARKET_CLOSED');
    });
  });

  describe('Policy Evaluation - USSD Channel Limit', () => {
    it('should flag large USSD transactions for review', () => {
      const ctx: PolicyContext = {
        action: 'predict:create',
        subject: {
          userId: 11,
          role: 'MEMBER',
          status: 'ACTIVE',
          kycTier: 'VERIFIED',
          countryCode: 'TZ',
          currency: 'TZS',
          balance: 500000,
        },
        amount: 300000, // ~114 USD, exceeds 100 USD USSD ceiling
        dailySpend: 0,
        channel: 'USSD',
      };

      const decision = evaluatePolicy(ctx);

      expect(decision.effect).toBe('REVIEW');
      expect(decision.codes).toContain('USSD_CEILING');
    });
  });

  describe('Policy Decision Priority', () => {
    it('should prioritize DENY over REVIEW', () => {
      // Transaction that would trigger both DENY (jurisdiction) and REVIEW (high amount)
      const ctx: PolicyContext = {
        action: 'predict:create',
        subject: {
          userId: 12,
          role: 'MEMBER',
          status: 'ACTIVE',
          kycTier: 'ENHANCED',
          countryCode: 'US', // Restricted
          currency: 'USD',
          balance: 50000,
        },
        amount: 20000, // Would trigger review
        dailySpend: 0,
        channel: 'WEB',
      };

      const decision = evaluatePolicy(ctx);

      expect(decision.effect).toBe('DENY');
      expect(decision.codes).toContain('JURISDICTION_BLOCKED');
    });
  });
});
