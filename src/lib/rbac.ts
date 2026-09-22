// Role-Based Access Control — roles aligned to platform capabilities.
//
// Roles are hierarchical by capability grant, not by inheritance chains,
// so every grant is explicit and auditable (least-privilege by default).

export const ROLES = [
  "GUEST",
  "MEMBER",
  "CREATOR",
  "RESOLVER",
  "COMPLIANCE",
  "TREASURY",
  "ADMIN",
  "SERVICE",
] as const;

export type Role = (typeof ROLES)[number];

export const CAPABILITIES = [
  // Discovery (public)
  "market:read",
  "chama:read",
  "i18n:read",
  // Participation
  "prediction:place",
  "chama:join",
  "chama:create",
  "wallet:deposit",
  "wallet:withdraw",
  "wallet:read",
  // Authoring
  "market:create",
  "market:update",
  // Settlement
  "market:resolve",
  "payout:distribute",
  // Compliance & risk
  "user:read",
  "user:suspend",
  "audit:read",
  "policy:override",
  "kyc:review",
  // Treasury
  "treasury:reconcile",
  "transaction:refund",
  // Platform
  "user:manage_roles",
  "market:delete",
  "system:configure",
  // Machine-to-machine
  "ussd:session",
  "webhook:receive",
  // AI
  "ai:generate",
  "ai:assist_resolution",
] as const;

export type Capability = (typeof CAPABILITIES)[number];

const PUBLIC: Capability[] = ["market:read", "chama:read", "i18n:read"];

const MEMBER: Capability[] = [
  ...PUBLIC,
  "prediction:place",
  "chama:join",
  "wallet:deposit",
  "wallet:withdraw",
  "wallet:read",
  "ai:generate",
];

const CREATOR: Capability[] = [...MEMBER, "market:create", "chama:create", "market:update"];

const RESOLVER: Capability[] = [
  ...PUBLIC,
  "wallet:read",
  "market:resolve",
  "payout:distribute",
  "audit:read",
  "ai:assist_resolution",
];

const COMPLIANCE: Capability[] = [
  ...PUBLIC,
  "user:read",
  "user:suspend",
  "audit:read",
  "kyc:review",
  "policy:override",
  "wallet:read",
];

const TREASURY: Capability[] = [
  ...PUBLIC,
  "wallet:read",
  "audit:read",
  "treasury:reconcile",
  "transaction:refund",
];

const ADMIN: Capability[] = [...CAPABILITIES];

const SERVICE: Capability[] = [
  ...PUBLIC,
  "ussd:session",
  "webhook:receive",
  "prediction:place",
  "wallet:deposit",
  "wallet:read",
];

export const ROLE_CAPABILITIES: Record<Role, Capability[]> = {
  GUEST: PUBLIC,
  MEMBER,
  CREATOR,
  RESOLVER,
  COMPLIANCE,
  TREASURY,
  ADMIN,
  SERVICE,
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  GUEST: "Anonymous visitor. Can browse public markets and Chama pools only.",
  MEMBER: "Verified participant. Places predictions, funds and withdraws from a wallet, joins Chamas.",
  CREATOR: "Community market author. Publishes markets and starts Chama pools on top of member rights.",
  RESOLVER: "Independent oracle. Resolves markets and triggers payouts; cannot move member funds.",
  COMPLIANCE: "Risk and KYC officer. Reviews users, suspends accounts and overrides policy with an audit trail.",
  TREASURY: "Finance operator. Reconciles ledgers and issues refunds; cannot resolve markets.",
  ADMIN: "Platform owner. Full capability set including role management and configuration.",
  SERVICE: "Machine identity for USSD gateways and payment webhooks. Narrow, non-human scope.",
};

export function capabilitiesFor(role: Role): Capability[] {
  return ROLE_CAPABILITIES[role] ?? PUBLIC;
}

export function can(role: Role | undefined | null, capability: Capability): boolean {
  if (!role) return PUBLIC.includes(capability);
  return capabilitiesFor(role).includes(capability);
}

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

/** Separation of duties: a single identity should not hold both sides. */
export const SEGREGATED_PAIRS: Array<[Capability, Capability]> = [
  ["market:resolve", "prediction:place"],
  ["transaction:refund", "wallet:withdraw"],
];

export function violatesSegregation(role: Role): Array<[Capability, Capability]> {
  const caps = capabilitiesFor(role);
  return SEGREGATED_PAIRS.filter(([a, b]) => caps.includes(a) && caps.includes(b));
}
