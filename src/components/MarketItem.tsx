import React from "react";
import {
  Coins,
  TrendingUp,
  Smartphone,
  Users,
  Wallet,
  Award,
  DollarSign,
  CheckCircle2,
  Plus,
  Search,
  Sparkles,
  ChevronRight,
  User,
  ArrowRightLeft,
  Bell,
  MapPin,
  HelpCircle,
  X,
  Lock,
  ChevronDown,
  Info,
  Flame,
  Globe,
  ExternalLink,
  Code
} from "lucide-react";
import { getTranslations, type Locale, LOCALE_NAMES, LOCALE_FLAGS } from "@/lib/i18n";
import { formatDate, formatNumber } from "@/lib/i18n-format";

interface MarketItemProps {
  market: any; // In a real app, we'd have a proper type
}

export function MarketItem({ market }: MarketItemProps) {
  // In a real implementation, we would get the user's currency and locale from context
  // For this example, we'll use defaults
  const t = getTranslations("en");
  const rates: { [key: string]: number } = {
    KES: 1,
    UGX: 30,
    TZS: 20,
    RWF: 10,
    NGN: 12,
    GHS: 0.06,
    ZAR: 0.14,
    CDF: 5.5,
    MAD: 0.075,
    USD: 0.0077,
    INR: 0.65,
    EUR: 0.0071,
    XOF: 4.70,
  };

  const currencySymbols: { [key: string]: string } = {
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

  // Using KES as default for display
  const userCurrency = "KES";
  const userRate = rates[userCurrency] || 1;
  const totalVolumeKES = market.volume || 0;
  const convertedVolume = Math.round(totalVolumeKES * userRate);

  const formatAmount = (amount: number, currency: string) => {
    return `${currencySymbols[currency] || currency} ${formatNumber(amount, {}, "en")}`;
  };

  const isResolved = market.status === "RESOLVED";

  return (
    <div className="bg-white dark:bg-slate-950 border-2 rounded-2xl p-4 flex flex-col justify-between transition-all relative overflow-hidden">
      {/* Featured ribbon / Category badge */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
          {market.category}
        </span>
        {market.isFeatured && !isResolved && (
          <span className="flex items-center gap-0.5 text-[9px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
            <Flame className="w-3 h-3 fill-slate-950" /> High Yield
          </span>
        )}
        {isResolved && (
          <span className="text-[9px] bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 font-extrabold px-1.5 py-0.5 rounded uppercase">
            Resolved: {market.winningOutcome}
          </span>
        )}
      </div>

      {/* Title */}
      <div>
        <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 hover:line-clamp-none">
          {market.title}
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-3">
          {market.description}
        </p>
      </div>

      {/* Stats & Odds buttons */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-900 flex flex-col gap-3">
        {/* Volume & Expiry */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>Pooled: <strong className="text-slate-600 dark:text-slate-300">{formatAmount(convertedVolume, userCurrency)}</strong></span>
          <span>Ends: {formatDate(new Date(market.endsAt), { month: "short", day: "numeric" }, "en")}</span>
        </div>

        {/* Interactive buy box or resolution outcome display */}
        {isResolved ? (
          <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded-xl text-center border border-slate-200 dark:border-slate-850">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-bold">Winning Outcome</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-black text-sm block">
              🏆 {market.winningOutcome === "YES" ? `YES (Paid ${market.oddsYes}x)` : `NO (Paid ${market.oddsNo}x)`}
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                // In a real app, we would set state to open prediction modal
                console.log("Predict YES clicked for market", market.id);
              }}
              className="bg-emerald-50 border border-emerald-500/40 text-emerald-700 hover:bg-emerald-500 hover:text-slate-950 dark:bg-emerald-950/60 dark:text-emerald-400 transition-all p-2 rounded-xl text-left"
            >
              <span className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Predict YES</span>
              <span className="font-extrabold text-sm">{market.oddsYes}x Odds</span>
            </button>
            <button
              onClick={() => {
                // In a real app, we would set state to open prediction modal
                console.log("Predict NO clicked for market", market.id);
              }}
              className="bg-rose-50 border border-rose-500/40 text-rose-700 hover:bg-rose-500 hover:text-slate-950 dark:bg-rose-950/60 dark:text-rose-400 transition-all p-2 rounded-xl text-left"
            >
              <span className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Predict NO</span>
              <span className="font-extrabold text-sm">{market.oddsNo}x Odds</span>
            </button>
          </div>
        )}

        {/* Quick Resolve Admin Panel Button (for simulation proof) */}
        {!isResolved && (
          <div className="mt-3 bg-slate-50 dark:bg-slate-900/90 border border-indigo-500/20 p-2 rounded-xl flex items-center justify-between">
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              <Lock className="w-3 h-3" /> Simulate Resolve:
            </span>
            <div className="flex gap-1.5">
              <button
                onClick={() => {
                  // In a real app, we would call resolveMarket function
                  console.log("Resolve YES clicked for market", market.id);
                }}
                className="bg-indigo-950 text-indigo-300 hover:bg-indigo-600 hover:text-white px-2 py-0.5 rounded text-[10px] font-extrabold transition-all"
              >
                YES
              </button>
              <button
                onClick={() => {
                  // In a real app, we would call resolveMarket function
                  console.log("Resolve NO clicked for market", market.id);
                }}
                className="bg-indigo-950 text-indigo-300 hover:bg-indigo-600 hover:text-white px-2 py-0.5 rounded text-[10px] font-extrabold transition-all"
              >
                NO
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}