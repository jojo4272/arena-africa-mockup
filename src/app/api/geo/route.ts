import { NextRequest, NextResponse } from "next/server";
import { resolveGeo, bonusFor, COUNTRY_PROFILES } from "@/lib/geo";
import { RESTRICTED_COUNTRIES } from "@/lib/policy";

export const dynamic = "force-dynamic";

/**
 * GET /api/geo
 * Detects the caller's country from edge headers or IP and returns the
 * account defaults (currency, locale, dial code, welcome bonus) so the
 * signup form can pre-fill itself with zero user input.
 */
export async function GET(request: NextRequest) {
  const geo = await resolveGeo(request.headers);

  return NextResponse.json({
    success: true,
    data: {
      ...geo,
      welcomeBonus: bonusFor(geo.currency),
      restricted: RESTRICTED_COUNTRIES.has(geo.countryCode),
      supportedCountries: Object.entries(COUNTRY_PROFILES)
        .map(([code, p]) => ({
          code,
          country: p.country,
          currency: p.currency,
          dialCode: p.dialCode,
          region: p.region,
        }))
        .sort((a, b) => a.country.localeCompare(b.country)),
    },
  });
}
