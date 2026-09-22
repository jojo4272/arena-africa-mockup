import { NextRequest, NextResponse } from "next/server";
import { getTranslations, type Locale, LOCALE_NAMES, LOCALE_FLAGS } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const VALID_LOCALES: Locale[] = ["en", "sw", "fr", "pt"];

// GET /api/i18n/[locale] - Get translations for a specific locale
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale } = await params;

  if (!VALID_LOCALES.includes(locale as Locale)) {
    return NextResponse.json({
      success: false,
      error: `Invalid locale. Valid locales: ${VALID_LOCALES.join(", ")}`
    }, { status: 400 });
  }

  const typedLocale = locale as Locale;
  const translations = getTranslations(typedLocale);

  return NextResponse.json({
    success: true,
    data: {
      locale: typedLocale,
      name: LOCALE_NAMES[typedLocale],
      flag: LOCALE_FLAGS[typedLocale],
      translations,
    }
  });
}
