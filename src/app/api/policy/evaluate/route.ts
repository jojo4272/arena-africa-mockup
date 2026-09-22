import { NextRequest, NextResponse } from "next/server";
import { evaluatePolicy, listPolicyRules, KYC_LIMITS, RESTRICTED_COUNTRIES, type PolicyContext } from "@/lib/policy";
import { ROLE_CAPABILITIES, ROLE_DESCRIPTIONS, ROLES, capabilitiesFor, isRole, violatesSegregation } from "@/lib/rbac";
import { db } from "@/db";
import { policyAudit } from "@/db/schema";
import { extractIp } from "@/lib/geo";

export const dynamic = "force-dynamic";

/** GET /api/policy/evaluate — introspection: roles, capabilities, rules, limits. */
export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      roles: ROLES.map((role) => ({
        role,
        description: ROLE_DESCRIPTIONS[role],
        capabilities: capabilitiesFor(role),
        capabilityCount: capabilitiesFor(role).length,
        segregationWarnings: violatesSegregation(role),
      })),
      rules: listPolicyRules(),
      kycLimits: KYC_LIMITS,
      restrictedCountries: Array.from(RESTRICTED_COUNTRIES),
      matrix: ROLE_CAPABILITIES,
    },
  });
}

/**
 * POST /api/policy/evaluate — dry-run a decision.
 * Body: { action, subject:{role,...}, resource?, amount?, dailySpend?, channel? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const role = String(body?.subject?.role || "GUEST");
    if (!isRole(role)) {
      return NextResponse.json({ success: false, error: `Unknown role '${role}'.` }, { status: 400 });
    }
    if (!body?.action) {
      return NextResponse.json({ success: false, error: "action is required" }, { status: 400 });
    }

    const ip = extractIp(request.headers);
    const ctx: PolicyContext = {
      action: body.action,
      subject: { ...body.subject, role },
      resource: body.resource,
      amount: body.amount != null ? Number(body.amount) : undefined,
      dailySpend: body.dailySpend != null ? Number(body.dailySpend) : undefined,
      channel: body.channel,
      ip,
    };

    const decision = evaluatePolicy(ctx);

    await db.insert(policyAudit).values({
      userId: ctx.subject.userId ?? null,
      action: String(ctx.action),
      effect: decision.effect,
      codes: decision.codes.join(",") || "NONE",
      reasons: decision.reasons.join(" | ").slice(0, 900),
      channel: ctx.channel || "API",
      ip,
    }).catch(() => undefined);

    return NextResponse.json({ success: true, data: decision });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
