// Policy Engine — a declarative, auditable decision layer that sits between
// authentication (who you are) and business logic (what happens).
//
// Every rule returns ALLOW / DENY / REVIEW with a machine-readable reason code,
// so decisions can be logged, replayed and explained to regulators.

import { can, type Capability, type Role } from "@/lib/rbac";
import { toUsd as convertToUsd } from "@/lib/rates";

export type Effect = "ALLOW" | "DENY" | "REVIEW";

export type KycTier = "NONE" | "BASIC" | "VERIFIED" | "ENHANCED";

export interface PolicySubject {
  userId?: number;
  role: Role;
  status?: "ACTIVE" | "SUSPENDED" | "CLOSED";
  kycTier?: KycTier;
  countryCode?: string;
  currency?: string;
  balance?: number;
  accountAgeDays?: number;
}

export interface PolicyResource {
  type: "market" | "prediction" | "wallet" | "chama" | "user" | "system" | "ai";
  id?: number | string;
  ownerId?: number;
  status?: string;
}

export interface PolicyContext {
  action: Capability;
  subject: PolicySubject;
  resource?: PolicyResource;
  /** Transaction amount normalised to the subject's currency. */
  amount?: number;
  /** Rolling 24h spend used for velocity checks. */
  dailySpend?: number;
  ip?: string;
  channel?: "WEB" | "MOBILE" | "USSD" | "API";
}

export interface PolicyDecision {
  effect: Effect;
  allowed: boolean;
  reasons: string[];
  /** Machine-readable codes, e.g. RBAC_DENIED, KYC_TIER_TOO_LOW. */
  codes: string[];
  matchedRules: string[];
  obligations: string[];
  evaluatedAt: string;
}

interface RuleOutcome {
  effect: Effect;
  code: string;
  reason: string;
  obligation?: string;
}

interface PolicyRule {
  id: string;
  description: string;
  evaluate: (ctx: PolicyContext) => RuleOutcome | null;
}

/** Per-transaction ceilings by KYC tier, expressed in USD-equivalent. */
export const KYC_LIMITS: Record<KycTier, { perTxUsd: number; dailyUsd: number }> = {
  NONE: { perTxUsd: 20, dailyUsd: 50 },
  BASIC: { perTxUsd: 200, dailyUsd: 500 },
  VERIFIED: { perTxUsd: 2000, dailyUsd: 10000 },
  ENHANCED: { perTxUsd: 25000, dailyUsd: 100000 },
};

/**
 * Convert to USD using centralized rates from @/lib/rates.
 * Re-exported for backward compatibility.
 */
export function toUsd(amount: number, currency: string): number {
  return convertToUsd(amount, currency);
}

/** Jurisdictions where real-money participation is not offered. */
export const RESTRICTED_COUNTRIES = new Set(["US", "FR"]);

const RULES: PolicyRule[] = [
  {
    id: "rbac.capability",
    description: "Subject's role must grant the requested capability.",
    evaluate: (ctx) =>
      can(ctx.subject.role, ctx.action)
        ? null
        : {
            effect: "DENY",
            code: "RBAC_DENIED",
            reason: `Role ${ctx.subject.role} does not grant '${ctx.action}'.`,
          },
  },
  {
    id: "account.status",
    description: "Suspended or closed accounts cannot transact.",
    evaluate: (ctx) => {
      const status = ctx.subject.status ?? "ACTIVE";
      if (status === "ACTIVE") return null;
      const mutating = ctx.action !== "market:read" && ctx.action !== "wallet:read";
      if (!mutating) return null;
      return {
        effect: "DENY",
        code: status === "SUSPENDED" ? "ACCOUNT_SUSPENDED" : "ACCOUNT_CLOSED",
        reason: `Account status is ${status}.`,
      };
    },
  },
  {
    id: "jurisdiction.restricted",
    description: "Block staking from jurisdictions without a licence.",
    evaluate: (ctx) => {
      const staking: Capability[] = ["prediction:place", "chama:join", "chama:create"];
      if (!staking.includes(ctx.action)) return null;
      const cc = ctx.subject.countryCode?.toUpperCase();
      if (cc && RESTRICTED_COUNTRIES.has(cc)) {
        return {
          effect: "DENY",
          code: "JURISDICTION_RESTRICTED",
          reason: `Real-money participation is not available in ${cc} pending licensing.`,
        };
      }
      return null;
    },
  },
  {
    id: "kyc.per_transaction",
    description: "Per-transaction value must sit inside the KYC tier ceiling.",
    evaluate: (ctx) => {
      if (ctx.amount == null) return null;
      const tier = ctx.subject.kycTier ?? "NONE";
      const usd = toUsd(ctx.amount, ctx.subject.currency ?? "KES");
      const limit = KYC_LIMITS[tier].perTxUsd;
      if (usd <= limit) return null;
      return {
        effect: "REVIEW",
        code: "KYC_TIER_TOO_LOW",
        reason: `Amount ≈$${usd.toFixed(2)} exceeds the ${tier} per-transaction limit of $${limit}.`,
        obligation: "UPGRADE_KYC",
      };
    },
  },
  {
    id: "kyc.daily_velocity",
    description: "Rolling 24h spend must sit inside the tier ceiling.",
    evaluate: (ctx) => {
      if (ctx.amount == null || ctx.dailySpend == null) return null;
      const tier = ctx.subject.kycTier ?? "NONE";
      const currency = ctx.subject.currency ?? "KES";
      const total = toUsd(ctx.dailySpend + ctx.amount, currency);
      const limit = KYC_LIMITS[tier].dailyUsd;
      if (total <= limit) return null;
      return {
        effect: "REVIEW",
        code: "DAILY_LIMIT_EXCEEDED",
        reason: `24h volume ≈$${total.toFixed(2)} exceeds the ${tier} daily limit of $${limit}.`,
        obligation: "MANUAL_REVIEW",
      };
    },
  },
  {
    id: "wallet.sufficient_funds",
    description: "Debits cannot exceed the available balance.",
    evaluate: (ctx) => {
      const debits: Capability[] = ["prediction:place", "chama:join", "chama:create", "wallet:withdraw"];
      if (!debits.includes(ctx.action)) return null;
      if (ctx.amount == null || ctx.subject.balance == null) return null;
      if (ctx.amount <= ctx.subject.balance) return null;
      return {
        effect: "DENY",
        code: "INSUFFICIENT_FUNDS",
        reason: `Requires ${ctx.amount} but balance is ${ctx.subject.balance}.`,
      };
    },
  },
  {
    id: "market.open_only",
    description: "Predictions are only accepted on open markets.",
    evaluate: (ctx) => {
      if (ctx.action !== "prediction:place") return null;
      if (!ctx.resource || ctx.resource.type !== "market") return null;
      if (!ctx.resource.status || ctx.resource.status === "OPEN") return null;
      return {
        effect: "DENY",
        code: "MARKET_CLOSED",
        reason: `Market is ${ctx.resource.status}.`,
      };
    },
  },
  {
    id: "settlement.segregation_of_duties",
    description: "A resolver may not settle a market they hold a position in.",
    evaluate: (ctx) => {
      if (ctx.action !== "market:resolve") return null;
      if (ctx.resource?.ownerId && ctx.resource.ownerId === ctx.subject.userId) {
        return {
          effect: "REVIEW",
          code: "SEGREGATION_OF_DUTIES",
          reason: "Resolver has an interest in this market; a second approver is required.",
          obligation: "SECOND_APPROVER",
        };
      }
      return null;
    },
  },
  {
    id: "responsible.stake_ceiling",
    description: "Single stake capped at 50% of balance for new accounts.",
    evaluate: (ctx) => {
      if (ctx.action !== "prediction:place") return null;
      if (ctx.amount == null || !ctx.subject.balance) return null;
      const isNew = (ctx.subject.accountAgeDays ?? 999) < 7;
      if (!isNew) return null;
      if (ctx.amount <= ctx.subject.balance * 0.5) return null;
      return {
        effect: "REVIEW",
        code: "RESPONSIBLE_STAKE_LIMIT",
        reason: "New accounts are limited to 50% of balance on a single position.",
        obligation: "CONFIRM_RESPONSIBLE_PLAY",
      };
    },
  },
  {
    id: "channel.ussd_ceiling",
    description: "USSD sessions carry a lower ceiling (no rich confirmation UI).",
    evaluate: (ctx) => {
      if (ctx.channel !== "USSD" || ctx.amount == null) return null;
      const usd = toUsd(ctx.amount, ctx.subject.currency ?? "KES");
      if (usd <= 100) return null;
      return {
        effect: "REVIEW",
        code: "USSD_CEILING",
        reason: `USSD transactions above $100 require confirmation on web or mobile.`,
        obligation: "STEP_UP_CHANNEL",
      };
    },
  },
];

/**
 * Evaluate every rule. DENY beats REVIEW, REVIEW beats ALLOW (fail-closed).
 */
export function evaluatePolicy(ctx: PolicyContext): PolicyDecision {
  const reasons: string[] = [];
  const codes: string[] = [];
  const matchedRules: string[] = [];
  const obligations: string[] = [];
  let effect: Effect = "ALLOW";

  for (const rule of RULES) {
    let outcome: RuleOutcome | null = null;
    try {
      outcome = rule.evaluate(ctx);
    } catch {
      outcome = { effect: "DENY", code: "RULE_ERROR", reason: `Rule ${rule.id} failed to evaluate.` };
    }
    if (!outcome) continue;

    matchedRules.push(rule.id);
    reasons.push(outcome.reason);
    codes.push(outcome.code);
    if (outcome.obligation) obligations.push(outcome.obligation);

    if (outcome.effect === "DENY") effect = "DENY";
    else if (outcome.effect === "REVIEW" && effect !== "DENY") effect = "REVIEW";
  }

  if (effect === "ALLOW") reasons.push("All policy checks passed.");

  return {
    effect,
    allowed: effect === "ALLOW",
    reasons,
    codes,
    matchedRules,
    obligations: Array.from(new Set(obligations)),
    evaluatedAt: new Date().toISOString(),
  };
}

export function listPolicyRules() {
  return RULES.map((r) => ({ id: r.id, description: r.description }));
}
