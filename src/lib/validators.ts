/**
 * Shared business logic validators — ensure Server Actions and API routes
 * enforce the same rules consistently.
 */

import { db } from "@/db";
import { users, markets, transactions } from "@/db/schema";
import { eq, and, sql, gte } from "drizzle-orm";
import { evaluatePolicy, type PolicyContext } from "@/lib/policy";
import type { Capability } from "@/lib/rbac";

export interface ValidationResult {
  allowed: boolean;
  error?: string;
  codes?: string[];
  reasons?: string[];
}

/**
 * Calculate rolling 24-hour spend for a user.
 */
export async function getDailySpend(userId: number, currency: string): Promise<number> {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const result = await db
    .select({ total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)` })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.currency, currency),
        gte(transactions.createdAt, twentyFourHoursAgo),
        sql`${transactions.type} IN ('PREDICT_BUY', 'WITHDRAWAL')`
      )
    );

  return Number(result[0]?.total ?? 0);
}

/**
 * Validate a prediction placement through the policy engine.
 */
export async function validatePrediction(params: {
  userId: number;
  marketId: number;
  amount: number;
  channel: "WEB" | "MOBILE" | "USSD" | "API";
  ip?: string;
}): Promise<ValidationResult> {
  // Fetch user
  const userList = await db.select().from(users).where(eq(users.id, params.userId));
  const user = userList[0];
  if (!user) {
    return { allowed: false, error: "User not found" };
  }

  // Fetch market
  const marketList = await db.select().from(markets).where(eq(markets.id, params.marketId));
  const market = marketList[0];
  if (!market) {
    return { allowed: false, error: "Market not found" };
  }

  // Calculate daily spend
  const dailySpend = await getDailySpend(params.userId, user.currency);

  // Build policy context
  const policyContext: PolicyContext = {
    action: "predict:create" as Capability,
    subject: {
      userId: user.id,
      role: user.role as any,
      status: user.status as any,
      kycTier: user.kycTier as any,
      countryCode: user.countryCode,
      currency: user.currency,
      balance: user.balance,
    },
    resource: {
      type: "market",
      id: market.id,
      status: market.status,
    },
    amount: params.amount,
    dailySpend: dailySpend,
    ip: params.ip,
    channel: params.channel,
  };

  // Evaluate policy
  const decision = evaluatePolicy(policyContext);

  if (!decision.allowed) {
    return {
      allowed: false,
      error: decision.reasons[0] || "Policy denied this action",
      codes: decision.codes,
      reasons: decision.reasons,
    };
  }

  return { allowed: true };
}

/**
 * Validate a deposit through the policy engine.
 */
export async function validateDeposit(params: {
  userId: number;
  amount: number;
  channel: "WEB" | "MOBILE" | "USSD" | "API";
  ip?: string;
}): Promise<ValidationResult> {
  const userList = await db.select().from(users).where(eq(users.id, params.userId));
  const user = userList[0];
  if (!user) {
    return { allowed: false, error: "User not found" };
  }

  const dailySpend = await getDailySpend(params.userId, user.currency);

  const policyContext: PolicyContext = {
    action: "wallet:deposit" as Capability,
    subject: {
      userId: user.id,
      role: user.role as any,
      status: user.status as any,
      kycTier: user.kycTier as any,
      countryCode: user.countryCode,
      currency: user.currency,
      balance: user.balance,
    },
    resource: {
      type: "wallet",
      id: user.id,
    },
    amount: params.amount,
    dailySpend: dailySpend,
    ip: params.ip,
    channel: params.channel,
  };

  const decision = evaluatePolicy(policyContext);

  if (!decision.allowed) {
    return {
      allowed: false,
      error: decision.reasons[0] || "Policy denied this action",
      codes: decision.codes,
      reasons: decision.reasons,
    };
  }

  return { allowed: true };
}

/**
 * Validate a withdrawal through the policy engine.
 */
export async function validateWithdrawal(params: {
  userId: number;
  amount: number;
  channel: "WEB" | "MOBILE" | "USSD" | "API";
  ip?: string;
}): Promise<ValidationResult> {
  const userList = await db.select().from(users).where(eq(users.id, params.userId));
  const user = userList[0];
  if (!user) {
    return { allowed: false, error: "User not found" };
  }

  if (user.balance < params.amount) {
    return {
      allowed: false,
      error: `Insufficient funds. Current balance: ${user.balance} ${user.currency}`,
    };
  }

  const dailySpend = await getDailySpend(params.userId, user.currency);

  const policyContext: PolicyContext = {
    action: "wallet:withdraw" as Capability,
    subject: {
      userId: user.id,
      role: user.role as any,
      status: user.status as any,
      kycTier: user.kycTier as any,
      countryCode: user.countryCode,
      currency: user.currency,
      balance: user.balance,
    },
    resource: {
      type: "wallet",
      id: user.id,
    },
    amount: params.amount,
    dailySpend: dailySpend,
    ip: params.ip,
    channel: params.channel,
  };

  const decision = evaluatePolicy(policyContext);

  if (!decision.allowed) {
    return {
      allowed: false,
      error: decision.reasons[0] || "Policy denied this action",
      codes: decision.codes,
      reasons: decision.reasons,
    };
  }

  return { allowed: true };
}

/**
 * Validate chama creation through the policy engine.
 */
export async function validateChamaCreation(params: {
  userId: number;
  marketId: number;
  contribution: number;
  channel: "WEB" | "MOBILE" | "USSD" | "API";
  ip?: string;
}): Promise<ValidationResult> {
  const userList = await db.select().from(users).where(eq(users.id, params.userId));
  const user = userList[0];
  if (!user) {
    return { allowed: false, error: "User not found" };
  }

  const marketList = await db.select().from(markets).where(eq(markets.id, params.marketId));
  const market = marketList[0];
  if (!market) {
    return { allowed: false, error: "Market not found" };
  }

  const dailySpend = await getDailySpend(params.userId, user.currency);

  const policyContext: PolicyContext = {
    action: "chama:create" as Capability,
    subject: {
      userId: user.id,
      role: user.role as any,
      status: user.status as any,
      kycTier: user.kycTier as any,
      countryCode: user.countryCode,
      currency: user.currency,
      balance: user.balance,
    },
    resource: {
      type: "chama",
    },
    amount: params.contribution,
    dailySpend: dailySpend,
    ip: params.ip,
    channel: params.channel,
  };

  const decision = evaluatePolicy(policyContext);

  if (!decision.allowed) {
    return {
      allowed: false,
      error: decision.reasons[0] || "Policy denied this action",
      codes: decision.codes,
      reasons: decision.reasons,
    };
  }

  return { allowed: true };
}

/**
 * Validate chama joining through the policy engine.
 */
export async function validateChamaJoin(params: {
  userId: number;
  contribution: number;
  channel: "WEB" | "MOBILE" | "USSD" | "API";
  ip?: string;
}): Promise<ValidationResult> {
  const userList = await db.select().from(users).where(eq(users.id, params.userId));
  const user = userList[0];
  if (!user) {
    return { allowed: false, error: "User not found" };
  }

  const dailySpend = await getDailySpend(params.userId, user.currency);

  const policyContext: PolicyContext = {
    action: "chama:join" as Capability,
    subject: {
      userId: user.id,
      role: user.role as any,
      status: user.status as any,
      kycTier: user.kycTier as any,
      countryCode: user.countryCode,
      currency: user.currency,
      balance: user.balance,
    },
    resource: {
      type: "chama",
    },
    amount: params.contribution,
    dailySpend: dailySpend,
    ip: params.ip,
    channel: params.channel,
  };

  const decision = evaluatePolicy(policyContext);

  if (!decision.allowed) {
    return {
      allowed: false,
      error: decision.reasons[0] || "Policy denied this action",
      codes: decision.codes,
      reasons: decision.reasons,
    };
  }

  return { allowed: true };
}
