// Native Intl-based internationalization utilities
// Provides advanced formatting for relative time, date, number, and pluralization

// Use native Intl APIs for date and number formatting
// Cache for formatters per locale
const relativeFormatCache = new Map<string, Intl.RelativeTimeFormat>();
const dateTimeFormatCache = new Map<string, Map<string, Intl.DateTimeFormat>>();
const numberFormatCache = new Map<string, Map<string, Intl.NumberFormat>>();
const pluralRulesCache = new Map<string, Intl.PluralRules>();

/**
 * Get a relative time formatter for the given locale
 */
export function getRelativeFormat(locale: string): Intl.RelativeTimeFormat {
  if (!relativeFormatCache.has(locale)) {
    relativeFormatCache.set(locale, new Intl.RelativeTimeFormat(locale, { style: 'long' }));
  }
  return relativeFormatCache.get(locale)!;
}

/**
 * Format a relative time value (e.g., "5 minutes ago")
 */
export function formatRelativeTime(
  value: number,
  unit: Intl.RelativeTimeFormatUnit,
  locale: string
): string {
  return getRelativeFormat(locale).format(value, unit);
}

/**
 * Get a date time formatter for the given locale and options
 */
function getDateTimeFormat(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const localeCache = dateTimeFormatCache.get(locale);
  if (localeCache && localeCache.has(JSON.stringify(options))) {
    return localeCache.get(JSON.stringify(options))!;
  }
  const formatter = new Intl.DateTimeFormat(locale, options);
  if (!dateTimeFormatCache.has(locale)) {
    dateTimeFormatCache.set(locale, new Map());
  }
  dateTimeFormatCache.get(locale)!.set(JSON.stringify(options), formatter);
  return formatter;
}

/**
 * Format a date according to locale and options
 */
export function formatDate(
  date: Date | number,
  options: Intl.DateTimeFormatOptions = {},
  locale: string = 'en'
): string {
  return getDateTimeFormat(locale, options).format(new Date(date));
}

/**
 * Get a number formatter for the given locale and options
 */
function getNumberFormat(locale: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const localeCache = numberFormatCache.get(locale);
  if (localeCache && localeCache.has(JSON.stringify(options))) {
    return localeCache.get(JSON.stringify(options))!;
  }
  const formatter = new Intl.NumberFormat(locale, options);
  if (!numberFormatCache.has(locale)) {
    numberFormatCache.set(locale, new Map());
  }
  numberFormatCache.get(locale)!.set(JSON.stringify(options), formatter);
  return formatter;
}

/**
 * Format a number according to locale and options
 */
export function formatNumber(
  number: number,
  options: Intl.NumberFormatOptions = {},
  locale: string = 'en'
): string {
  return getNumberFormat(locale, options).format(number);
}

/**
 * Get plural rules for the given locale
 */
export function getPluralRules(locale: string): Intl.PluralRules {
  if (!pluralRulesCache.has(locale)) {
    pluralRulesCache.set(locale, new Intl.PluralRules(locale));
  }
  return pluralRulesCache.get(locale)!;
}

/**
 * Format a pluralization string based on the value and locale
 *
 * @param value The number to pluralize
 * @param options Pluralization strings for different categories
 * @param locale The locale to use for pluralization rules
 * @returns The appropriate pluralization string
 */
export function formatPlural(
  value: number,
  options: {
    zero?: string;
    one?: string;
    two?: string;
    few?: string;
    many?: string;
    other: string;
  },
  locale: string
): string {
  const pluralRules = getPluralRules(locale);
  const rule = pluralRules.select(value);
  return options[rule] || options.other;
}