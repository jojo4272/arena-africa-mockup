// Geolocation → country → currency/locale automation.
//
// Resolution order (fastest & most reliable first):
//   1. Edge/CDN headers (Cloudflare, Vercel, Fly) — zero latency, no quota
//   2. Free IP geolocation lookup (ip-api.com) — fallback for self-hosted
//   3. Safe default (Kenya/KES) — never blocks registration
//
// Used to pre-fill the signup form so a user in Lagos gets NGN automatically.

import type { Locale } from "@/lib/i18n";

export interface GeoProfile {
  ip: string;
  countryCode: string;
  country: string;
  currency: string;
  locale: Locale;
  dialCode: string;
  region: "East Africa" | "West Africa" | "Southern Africa" | "North Africa" | "Central Africa" | "Global";
  source: "header" | "lookup" | "default";
  confidence: "high" | "medium" | "low";
}

interface CountryProfile {
  country: string;
  currency: string;
  locale: Locale;
  dialCode: string;
  region: GeoProfile["region"];
}

/** ISO-3166 alpha-2 → localized account defaults. */
export const COUNTRY_PROFILES: Record<string, CountryProfile> = {
  // East Africa
  KE: { country: "Kenya", currency: "KES", locale: "sw", dialCode: "+254", region: "East Africa" },
  UG: { country: "Uganda", currency: "UGX", locale: "en", dialCode: "+256", region: "East Africa" },
  TZ: { country: "Tanzania", currency: "TZS", locale: "sw", dialCode: "+255", region: "East Africa" },
  RW: { country: "Rwanda", currency: "RWF", locale: "fr", dialCode: "+250", region: "East Africa" },
  ET: { country: "Ethiopia", currency: "ETB", locale: "en", dialCode: "+251", region: "East Africa" },
  // West Africa
  NG: { country: "Nigeria", currency: "NGN", locale: "en", dialCode: "+234", region: "West Africa" },
  GH: { country: "Ghana", currency: "GHS", locale: "en", dialCode: "+233", region: "West Africa" },
  SN: { country: "Senegal", currency: "XOF", locale: "fr", dialCode: "+221", region: "West Africa" },
  CI: { country: "Côte d'Ivoire", currency: "XOF", locale: "fr", dialCode: "+225", region: "West Africa" },
  // Southern Africa
  ZA: { country: "South Africa", currency: "ZAR", locale: "en", dialCode: "+27", region: "Southern Africa" },
  ZM: { country: "Zambia", currency: "ZMW", locale: "en", dialCode: "+260", region: "Southern Africa" },
  ZW: { country: "Zimbabwe", currency: "USD", locale: "en", dialCode: "+263", region: "Southern Africa" },
  MZ: { country: "Mozambique", currency: "MZN", locale: "pt", dialCode: "+258", region: "Southern Africa" },
  AO: { country: "Angola", currency: "AOA", locale: "pt", dialCode: "+244", region: "Southern Africa" },
  // North Africa
  MA: { country: "Morocco", currency: "MAD", locale: "fr", dialCode: "+212", region: "North Africa" },
  EG: { country: "Egypt", currency: "EGP", locale: "en", dialCode: "+20", region: "North Africa" },
  TN: { country: "Tunisia", currency: "TND", locale: "fr", dialCode: "+216", region: "North Africa" },
  DZ: { country: "Algeria", currency: "DZD", locale: "fr", dialCode: "+213", region: "North Africa" },
  // Central Africa
  CD: { country: "DRC", currency: "CDF", locale: "fr", dialCode: "+243", region: "Central Africa" },
  CM: { country: "Cameroon", currency: "XAF", locale: "fr", dialCode: "+237", region: "Central Africa" },
  // Global
  US: { country: "USA", currency: "USD", locale: "en", dialCode: "+1", region: "Global" },
  GB: { country: "United Kingdom", currency: "GBP", locale: "en", dialCode: "+44", region: "Global" },
  DE: { country: "Germany", currency: "EUR", locale: "en", dialCode: "+49", region: "Global" },
  FR: { country: "France", currency: "EUR", locale: "fr", dialCode: "+33", region: "Global" },
  PT: { country: "Portugal", currency: "EUR", locale: "pt", dialCode: "+351", region: "Global" },
  BR: { country: "Brazil", currency: "BRL", locale: "pt", dialCode: "+55", region: "Global" },
  IN: { country: "India", currency: "INR", locale: "en", dialCode: "+91", region: "Global" },
  AE: { country: "UAE", currency: "AED", locale: "en", dialCode: "+971", region: "Global" },
};

export const DEFAULT_COUNTRY_CODE = "KE";

/** Opening bonus per currency so new accounts start with usable balance. */
export const WELCOME_BONUS: Record<string, number> = {
  KES: 2500, UGX: 75000, TZS: 50000, RWF: 25000, ETB: 1200,
  NGN: 30000, GHS: 300, XOF: 12000, ZAR: 400, ZMW: 500,
  MZN: 1300, AOA: 18000, MAD: 200, EGP: 1000, TND: 65,
  DZD: 2800, CDF: 55000, XAF: 12000, USD: 20, GBP: 16,
  EUR: 18, BRL: 100, INR: 1600, AED: 75,
};

export function bonusFor(currency: string): number {
  return WELCOME_BONUS[currency] ?? 2500;
}

export function profileFor(countryCode: string): CountryProfile {
  return COUNTRY_PROFILES[countryCode.toUpperCase()] || COUNTRY_PROFILES[DEFAULT_COUNTRY_CODE];
}

/** Country name → ISO code (for manual form selection). */
export function codeForCountry(name: string): string {
  const hit = Object.entries(COUNTRY_PROFILES).find(([, p]) => p.country === name);
  return hit ? hit[0] : DEFAULT_COUNTRY_CODE;
}

export function extractIp(headers: Headers): string {
  const candidates = [
    headers.get("cf-connecting-ip"),
    headers.get("x-real-ip"),
    headers.get("x-forwarded-for")?.split(",")[0],
    headers.get("x-vercel-forwarded-for"),
  ];
  for (const c of candidates) {
    const ip = c?.trim();
    if (ip) return ip;
  }
  return "unknown";
}

function isPrivateIp(ip: string): boolean {
  return (
    ip === "unknown" ||
    ip === "::1" ||
    ip.startsWith("127.") ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip)
  );
}

/** Country code straight from a CDN/edge header, if present. */
function countryFromHeaders(headers: Headers): string | null {
  const code =
    headers.get("cf-ipcountry") ||
    headers.get("x-vercel-ip-country") ||
    headers.get("x-country-code") ||
    headers.get("fly-client-country");
  if (!code || code === "XX" || code.length !== 2) return null;
  return code.toUpperCase();
}

/** Best-effort IP lookup; never throws, short timeout so signup stays fast. */
async function lookupCountry(ip: string): Promise<string | null> {
  if (isPrivateIp(ip)) return null;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,countryCode`, {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const json = await res.json();
    if (json?.status === "success" && typeof json.countryCode === "string") {
      return json.countryCode.toUpperCase();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Resolve a full account profile (country, currency, locale, dial code)
 * from the incoming request. Always returns a usable result.
 */
export async function resolveGeo(headers: Headers): Promise<GeoProfile> {
  const ip = extractIp(headers);

  const headerCode = countryFromHeaders(headers);
  if (headerCode && COUNTRY_PROFILES[headerCode]) {
    const p = profileFor(headerCode);
    return { ip, countryCode: headerCode, ...p, source: "header", confidence: "high" };
  }

  const lookedUp = await lookupCountry(ip);
  if (lookedUp && COUNTRY_PROFILES[lookedUp]) {
    const p = profileFor(lookedUp);
    return { ip, countryCode: lookedUp, ...p, source: "lookup", confidence: "medium" };
  }

  const p = profileFor(DEFAULT_COUNTRY_CODE);
  return { ip, countryCode: DEFAULT_COUNTRY_CODE, ...p, source: "default", confidence: "low" };
}

/** Infer the country from a dialling prefix — used to auto-correct signups. */
export function countryFromPhone(phone: string): string | null {
  const normalized = phone.replace(/[^\d+]/g, "");
  if (!normalized.startsWith("+")) return null;
  const entries = Object.entries(COUNTRY_PROFILES).sort(
    (a, b) => b[1].dialCode.length - a[1].dialCode.length
  );
  for (const [code, p] of entries) {
    if (normalized.startsWith(p.dialCode)) return code;
  }
  return null;
}
