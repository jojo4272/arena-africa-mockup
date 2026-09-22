/**
 * Currency exchange rates — single source of truth.
 *
 * Rates are expressed relative to USD for consistent limit calculations.
 * Last updated: 2026-09-15
 *
 * IMPORTANT: These are demo rates. In production, fetch from a currency API
 * (e.g., exchangerate-api.com, fixer.io, OpenExchangeRates) and cache with TTL.
 */

export interface ExchangeRate {
  code: string;
  name: string;
  symbol: string;
  toUsd: number;
  region: 'east-africa' | 'west-africa' | 'southern-africa' | 'north-africa' | 'global';
}

export const EXCHANGE_RATES: Record<string, ExchangeRate> = {
  // East Africa
  KES: { code: 'KES', name: 'Kenyan Shilling', symbol: 'KES', toUsd: 0.0077, region: 'east-africa' },
  UGX: { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh', toUsd: 0.00026, region: 'east-africa' },
  TZS: { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh', toUsd: 0.00038, region: 'east-africa' },
  RWF: { code: 'RWF', name: 'Rwandan Franc', symbol: 'RF', toUsd: 0.00077, region: 'east-africa' },
  ETB: { code: 'ETB', name: 'Ethiopian Birr', symbol: 'Br', toUsd: 0.0079, region: 'east-africa' },

  // West Africa
  NGN: { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', toUsd: 0.00065, region: 'west-africa' },
  GHS: { code: 'GHS', name: 'Ghanaian Cedi', symbol: 'GH₵', toUsd: 0.064, region: 'west-africa' },
  XOF: { code: 'XOF', name: 'CFA Franc (West)', symbol: 'CFA', toUsd: 0.0016, region: 'west-africa' },

  // Southern Africa
  ZAR: { code: 'ZAR', name: 'South African Rand', symbol: 'R', toUsd: 0.055, region: 'southern-africa' },
  ZMW: { code: 'ZMW', name: 'Zambian Kwacha', symbol: 'ZK', toUsd: 0.038, region: 'southern-africa' },
  MZN: { code: 'MZN', name: 'Mozambican Metical', symbol: 'MT', toUsd: 0.016, region: 'southern-africa' },
  AOA: { code: 'AOA', name: 'Angolan Kwanza', symbol: 'Kz', toUsd: 0.0011, region: 'southern-africa' },

  // North Africa
  MAD: { code: 'MAD', name: 'Moroccan Dirham', symbol: 'DH', toUsd: 0.10, region: 'north-africa' },
  EGP: { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£', toUsd: 0.021, region: 'north-africa' },
  TND: { code: 'TND', name: 'Tunisian Dinar', symbol: 'DT', toUsd: 0.32, region: 'north-africa' },
  DZD: { code: 'DZD', name: 'Algerian Dinar', symbol: 'DA', toUsd: 0.0074, region: 'north-africa' },

  // Central Africa
  CDF: { code: 'CDF', name: 'Congolese Franc', symbol: 'FC', toUsd: 0.00035, region: 'east-africa' },
  XAF: { code: 'XAF', name: 'CFA Franc (Central)', symbol: 'FCFA', toUsd: 0.0016, region: 'west-africa' },

  // Global reference currencies
  USD: { code: 'USD', name: 'US Dollar', symbol: '$', toUsd: 1.0, region: 'global' },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€', toUsd: 1.09, region: 'global' },
  GBP: { code: 'GBP', name: 'British Pound', symbol: '£', toUsd: 1.27, region: 'global' },
  INR: { code: 'INR', name: 'Indian Rupee', symbol: '₹', toUsd: 0.012, region: 'global' },
  BRL: { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', toUsd: 0.18, region: 'global' },
  AED: { code: 'AED', name: 'UAE Dirham', symbol: 'AED', toUsd: 0.27, region: 'global' },
};

/**
 * Convert an amount to USD using current exchange rates.
 * Falls back to KES rate for unknown currencies.
 */
export function toUsd(amount: number, currencyCode: string): number {
  const rate = EXCHANGE_RATES[currencyCode]?.toUsd ?? EXCHANGE_RATES.KES.toUsd;
  return amount * rate;
}

/**
 * Convert an amount from one currency to another.
 */
export function convertCurrency(amount: number, fromCurrency: string, toCurrency: string): number {
  const usdAmount = toUsd(amount, fromCurrency);
  const toRate = EXCHANGE_RATES[toCurrency]?.toUsd ?? EXCHANGE_RATES.KES.toUsd;
  return usdAmount / toRate;
}

/**
 * Get the display symbol for a currency.
 */
export function getCurrencySymbol(currencyCode: string): string {
  return EXCHANGE_RATES[currencyCode]?.symbol ?? currencyCode;
}

/**
 * Get the full name for a currency.
 */
export function getCurrencyName(currencyCode: string): string {
  return EXCHANGE_RATES[currencyCode]?.name ?? currencyCode;
}

/**
 * Format an amount with the correct currency symbol.
 */
export function formatCurrency(amount: number, currencyCode: string): string {
  const symbol = getCurrencySymbol(currencyCode);
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  // Put symbol before for USD/EUR/GBP, after for others (common convention)
  if (['USD', 'EUR', 'GBP'].includes(currencyCode)) {
    return `${symbol}${formatted}`;
  }
  return `${symbol} ${formatted}`;
}

/**
 * Get all currencies for a specific region.
 */
export function getCurrenciesByRegion(region: ExchangeRate['region']): ExchangeRate[] {
  return Object.values(EXCHANGE_RATES).filter(rate => rate.region === region);
}

/**
 * Validate if a currency code is supported.
 */
export function isSupportedCurrency(currencyCode: string): boolean {
  return currencyCode in EXCHANGE_RATES;
}

/**
 * Exchange rate metadata for monitoring.
 */
export const RATE_METADATA = {
  lastUpdated: '2026-09-15',
  source: 'demo-hardcoded',
  staleDays: 1,
};

/**
 * Check if rates are stale (for production monitoring).
 */
export function areRatesStale(): boolean {
  const lastUpdate = new Date(RATE_METADATA.lastUpdated);
  const now = new Date();
  const daysSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceUpdate > RATE_METADATA.staleDays;
}
