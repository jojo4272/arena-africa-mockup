// Card payment processing library — Visa, Mastercard, Discover
// Implements: BIN detection, Luhn checksum, expiry/CVV validation,
// PCI-style tokenization (no raw PAN stored), formatting + masking.

export const CARD_BRANDS = ["VISA", "MASTERCARD", "DISCOVER"] as const;
export type CardBrand = (typeof CARD_BRANDS)[number];

// Industry-standard test cards (never charged; used by the demo gateway)
export const TEST_CARDS: Record<CardBrand, string[]> = {
  VISA: ["4242424242424242", "4000056655665556"],
  MASTERCARD: ["5555555555554444", "2223003122003222"],
  DISCOVER: ["6011111111111117", "6011000990139424"],
};

export interface CardBrandMeta {
  name: string;
  label: string;
  test: string;
  prefix: string;
}

export const BRAND_META: Record<CardBrand, CardBrandMeta> = {
  VISA: { name: "Visa", label: "VISA", test: "4242 4242 4242 4242", prefix: "4" },
  MASTERCARD: { name: "Mastercard", label: "Mastercard", test: "5555 5555 5555 4444", prefix: "51–55 · 2221–2720" },
  DISCOVER: { name: "Discover", label: "Discover", test: "6011 1111 1111 1117", prefix: "6011 · 65 · 644–649" },
};

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/** Detect brand from the IIN/BIN using the public prefix ranges. */
export function detectBrand(rawNumber: string): CardBrand | "UNKNOWN" {
  const n = digitsOnly(rawNumber);
  if (n.startsWith("4")) return "VISA";
  if (/^(5[1-5]|2(2[2-9]|[3-6][0-9]|7[01]|720))/.test(n)) return "MASTERCARD";
  if (/^(6011|65|64[4-9]|622(12[6-9]|1[3-9][0-9]|[2-8][0-9]{2}|9[01][0-9]|92[0-5]))/.test(n)) return "DISCOVER";
  return "UNKNOWN";
}

/** Luhn checksum — every major card network uses it. */
export function luhnCheck(rawNumber: string): boolean {
  const n = digitsOnly(rawNumber);
  if (n.length < 12 || n.length > 19) return false;
  let sum = 0;
  let double = false;
  for (let i = n.length - 1; i >= 0; i--) {
    let d = Number(n[i]);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

/** Validate MM/YY expiry (not in the past, within 20 years). */
export function expiryValid(expiry: string): boolean {
  const m = /^(0[1-9]|1[0-2])\s*\/?\s*(\d{2})$/.exec(expiry.trim());
  if (!m) return false;
  const month = Number(m[1]);
  const year = 2000 + Number(m[2]);
  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth() + 1;
  if (year < curYear || (year === curYear && month < curMonth)) return false;
  return year <= curYear + 20;
}

/** CVV: 3 digits (Visa/MC/Discover) or 4 (Amex-style, accepted for robustness). */
export function cvvValid(cvv: string): boolean {
  return /^\d{3,4}$/.test(cvv.trim());
}

export interface CardValidation {
  brand: CardBrand | "UNKNOWN";
  last4: string;
  valid: boolean;
  errors: string[];
}

export function validateCard(rawNumber: string, expiry: string, cvv: string): CardValidation {
  const errors: string[] = [];
  const n = digitsOnly(rawNumber);
  const brand = detectBrand(n);

  if (brand === "UNKNOWN") errors.push("Card brand not supported. Use Visa, Mastercard or Discover.");
  if (!luhnCheck(n)) errors.push("Card number failed the Luhn checksum. Check for typos.");
  if (!expiryValid(expiry)) errors.push("Expiry is invalid or in the past. Use MM/YY.");
  if (!cvvValid(cvv)) errors.push("CVV must be 3–4 digits.");

  return {
    brand,
    last4: n.slice(-4),
    valid: errors.length === 0,
    errors,
  };
}

/** PCI-style tokenization: never persist the raw PAN. Only BIN + last4 retained. */
export function tokenizeCard(rawNumber: string): { token: string; bin: string; last4: string } {
  const n = digitsOnly(rawNumber);
  const random = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  return {
    token: `tok_card_${random}`,
    bin: n.slice(0, 6),
    last4: n.slice(-4),
  };
}

/** Demo gateway decline check — test cards ending 0002 decline like real issuer rejections. */
export function issuerApproves(rawNumber: string): { approved: boolean; code: string; message: string } {
  const n = digitsOnly(rawNumber);
  if (n.endsWith("0002")) {
    return { approved: false, code: "DECLINED", message: "Card declined by issuer (demo decline test)." };
  }
  return { approved: true, code: "APPROVED", message: "Authorization approved." };
}

export function formatCardNumber(raw: string): string {
  const n = digitsOnly(raw).slice(0, 19);
  return n.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

export function maskCardNumber(raw: string): string {
  const n = digitsOnly(raw);
  return `•••• •••• •••• ${n.slice(-4)}`;
}

export function generateAuthorizationCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}
