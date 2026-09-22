// Shared localization maps used by web dashboard + mobile app + components.

export const countryFlags: { [key: string]: string } = {
  Kenya: "🇰🇪",
  Uganda: "🇺🇬",
  Tanzania: "🇹🇿",
  Rwanda: "🇷🇼",
  Nigeria: "🇳🇬",
  Ghana: "🇬🇭",
  "South Africa": "🇿🇦",
  DRC: "🇨🇩",
  Morocco: "🇲🇦",
  USA: "🇺🇸",
  India: "🇮🇳",
  Germany: "🇩🇪",
};

export const currencySymbols: { [key: string]: string } = {
  KES: "KSh",
  UGX: "USh",
  TZS: "TSh",
  RWF: "FRw",
  NGN: "₦",
  GHS: "₵",
  ZAR: "R",
  CDF: "FC",
  MAD: "MAD",
  USD: "$",
  INR: "₹",
  EUR: "€",
  XOF: "CFA",
};

// Mobile-money providers commonly used per currency/country.
export const providerForCurrency: { [key: string]: string } = {
  KES: "M-PESA",
  UGX: "MTN_MOMO",
  RWF: "MTN_MOMO",
  TZS: "AIRTEL_MONEY",
  NGN: "AIRTEL_MONEY",
  GHS: "MTN_MOMO",
  ZAR: "AIRTEL_MONEY",
  CDF: "M-PESA",
  MAD: "AIRTEL_MONEY",
  USD: "WALLET",
  INR: "WALLET",
  EUR: "WALLET",
};

export function money(amount: number, currency: string): string {
  return `${currencySymbols[currency] || currency} ${Number(amount || 0).toLocaleString()}`;
}

export function flagFor(country: string): string {
  return countryFlags[country] || "🌍";
}
