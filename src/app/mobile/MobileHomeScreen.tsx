"use client";

import React, { useState } from "react";
import { TrendingUp, Flame, Search, Bell, Globe, ChevronRight } from "lucide-react";
import { getTranslations, type Locale, LOCALE_NAMES, LOCALE_FLAGS } from "@/lib/i18n";
import { formatNumber } from "@/lib/i18n-format";
import { useLocale } from "@/lib/locale-context";

interface Props {
  user: any;
  markets: any[];
  refresh: () => void;
  currencySymbol: string;
}

export default function MobileHomeScreen({
  user, markets, refresh, currencySymbol
}: Props) {
  const { locale, setLocale } = useLocale();
  const t = getTranslations(locale);
  const [category, setCategory] = useState<string>("all");
  const [selectedMarket, setSelectedMarket] = useState<any | null>(null);
  const [outcome, setOutcome] = useState<"YES" | "NO">("YES");
  const [amount, setAmount] = useState<number>(500);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const categories = [
    { id: "all", label: t.markets_all },
    { id: "sports", label: t.markets_sports },
    { id: "politics", label: t.markets_politics },
    { id: "economy", label: t.markets_economy },
    { id: "culture", label: t.markets_culture },
    { id: "crypto", label: t.markets_crypto },
    { id: "tech", label: t.markets_tech },
    { id: "climate", label: t.markets_climate },
    { id: "global", label: t.markets_global },
  ];

  const filteredMarkets = markets.filter(m => {
    const catMatch = category === "all" || m.category === category || (category === "global" && m.locale === "global");
    return catMatch;
  });

  const handlePredict = async () => {
    if (!selectedMarket) return;
    setLoading(true);
    try {
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          marketId: selectedMarket.id,
          outcome,
          amount,
          currency: user.currency,
          platform: "MOBILE"
        }),
      });
      const json = await res.json();
      if (json.success) {
        setNotification(`${t.predict_success} Payout: ${currencySymbol} ${json.potentialPayout}`);
        setSelectedMarket(null);
        refresh();
        setTimeout(() => setNotification(null), 3000);
      } else {
        setNotification(json.error);
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (e: any) {
      setNotification(e.message);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col">
      
      {/* Notification Banner */}
      {notification && (
        <div className="fixed top-20 left-4 right-4 bg-emerald-500 text-slate-950 text-xs font-bold p-3 rounded-xl shadow-lg z-50 animate-pulse">
          {notification}
        </div>
      )}

      {/* Header with User & Language */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-5 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10">
          <TrendingUp className="w-40 h-40 -mr-10 -mt-10" />
        </div>
        
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] opacity-80 uppercase tracking-widest">{t.common_welcome}</p>
            <p className="text-lg font-extrabold">{user?.name}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                const locales: Locale[] = ["en", "sw", "fr", "pt"];
                const idx = locales.indexOf(locale);
                setLocale(locales[(idx + 1) % locales.length]);
              }}
              className="bg-white/20 backdrop-blur px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1"
            >
              <Globe className="w-3 h-3" />
              <span>{LOCALE_FLAGS[locale]}</span>
              <span>{LOCALE_NAMES[locale]}</span>
            </button>
            <div className="bg-white/20 backdrop-blur p-2 rounded-lg">
              <Bell className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Balance Card */}
        <div className="bg-white/15 backdrop-blur rounded-2xl p-3 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] opacity-80 uppercase tracking-widest">{t.wallet_balance}</p>
              <p className="text-2xl font-black mt-0.5">
                {currencySymbol} {user?.balance ? formatNumber(user?.balance, {}, locale) : 0}
              </p>
              <p className="text-[9px] opacity-70 font-mono mt-0.5">{user?.phoneNumber}</p>
            </div>
            <div className="bg-white/25 p-3 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide p-3 bg-slate-900">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`whitespace-nowrap text-[11px] font-bold px-3 py-1.5 rounded-full transition-all ${
              category === cat.id 
                ? "bg-emerald-500 text-slate-950" 
                : "bg-slate-800 text-slate-400"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="px-3 pt-2">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            placeholder={t.markets_search}
            className="w-full bg-slate-800 text-white text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Markets List */}
      <div className="p-3 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-white">{t.markets_title}</h3>
          <span className="text-[10px] text-slate-400">{filteredMarkets.length} markets</span>
        </div>

        {filteredMarkets.map((m) => (
          <div
            key={m.id}
            onClick={() => {
              if (m.status === "OPEN") {
                setSelectedMarket(m);
                setOutcome("YES");
                setAmount(user.currency === "KES" ? 500 : (user.currency === "UGX" ? 15000 : 10000));
              }
            }}
            className={`bg-slate-800 rounded-2xl p-3 border ${
              m.isFeatured 
                ? "border-emerald-500/40 bg-gradient-to-br from-slate-800 to-emerald-950/30" 
                : "border-slate-700"
            } ${m.status === "OPEN" ? "cursor-pointer active:scale-[0.98] transition-transform" : "opacity-70"}`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] uppercase font-black text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded">
                {m.category}
              </span>
              {m.isFeatured && m.status === "OPEN" && (
                <span className="flex items-center gap-0.5 text-[9px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.5 rounded">
                  <Flame className="w-2.5 h-2.5 fill-slate-950" /> {t.markets_featured}
                </span>
              )}
              {m.status === "RESOLVED" && (
                <span className="text-[9px] bg-slate-700 text-slate-300 font-extrabold px-1.5 py-0.5 rounded">
                  {t.markets_resolved}: {m.winningOutcome}
                </span>
              )}
            </div>

            <h4 className="text-xs font-bold text-white leading-snug line-clamp-2">
              {m.title}
            </h4>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/50 text-[10px]">
              <span className="text-slate-400 font-mono">
                Vol: {currencySymbol} {formatNumber((m.volume || 0), {}, locale)}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded font-black">
                  YES {m.oddsYes}x
                </span>
                <span className="bg-rose-950 text-rose-400 px-1.5 py-0.5 rounded font-black">
                  NO {m.oddsNo}x
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Prediction Modal (Full-screen overlay on mobile) */}
      {selectedMarket && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
          <div className="bg-slate-900 flex-1 overflow-y-auto rounded-t-3xl mt-8">
            
            {/* Header with drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1 bg-slate-700 rounded-full"></div>
            </div>
            
            <div className="p-5">
              <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-md mb-2 inline-block">
                {t.predict_title}
              </span>

              <h3 className="text-base font-extrabold text-white leading-snug">
                {selectedMarket.title}
              </h3>

              <p className="text-xs text-slate-400 mt-2">
                {selectedMarket.description}
              </p>

              {/* Outcome selection */}
              <div className="mt-5">
                <label className="text-xs font-bold text-slate-300 block mb-2">{t.predict_outcome}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOutcome("YES")}
                    className={`p-3 rounded-2xl border text-center font-bold text-xs transition-all ${
                      outcome === "YES"
                        ? "bg-emerald-500/20 border-emerald-400 text-emerald-400"
                        : "bg-slate-950 border-slate-800 text-slate-400"
                    }`}
                  >
                    <span className="text-sm font-black block">{t.common_yes}</span>
                    <span className="text-[10px] opacity-75 mt-0.5 block">
                      {selectedMarket.oddsYes}x {t.markets_odds}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOutcome("NO")}
                    className={`p-3 rounded-2xl border text-center font-bold text-xs transition-all ${
                      outcome === "NO"
                        ? "bg-rose-500/20 border-rose-400 text-rose-400"
                        : "bg-slate-950 border-slate-800 text-slate-400"
                    }`}
                  >
                    <span className="text-sm font-black block">{t.common_no}</span>
                    <span className="text-[10px] opacity-75 mt-0.5 block">
                      {selectedMarket.oddsNo}x {t.markets_odds}
                    </span>
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div className="mt-4">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    {t.predict_amount} ({user.currency}):
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {t.predict_balance}: <strong className="text-emerald-400">{currencySymbol} {user?.balance ? formatNumber(user?.balance, {}, locale) : 0}</strong>
                  </span>
                </div>

                <input
                  type="number"
                  min="100"
                  value={amount}
                  onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="bg-slate-950 text-white w-full px-4 py-2.5 rounded-xl border border-slate-800 font-mono text-sm focus:outline-none focus:border-emerald-500"
                />

                <div className="grid grid-cols-4 gap-1.5 mt-2">
                  {[100, 500, 2000, 5000].map((preset) => {
                    let multiplier = 1;
                    if (user.currency === "UGX") multiplier = 30;
                    if (user.currency === "TZS") multiplier = 20;
                    if (user.currency === "RWF") multiplier = 10;
                    const targetVal = preset * multiplier;

                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setAmount(targetVal)}
                        className="bg-slate-950 hover:bg-slate-850 text-slate-300 border border-slate-800 rounded-lg py-1.5 text-[10px] font-bold transition-all"
                      >
                        +{preset}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Potential Payout */}
              <div className="mt-4 bg-slate-950 p-3 rounded-2xl border border-slate-850 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-[11px] block font-medium">{t.predict_potential}</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-amber-400 block font-mono">
                    {currencySymbol} {formatNumber(Math.round(amount * (outcome === "YES" ? selectedMarket.oddsYes : selectedMarket.oddsNo)), {}, locale)}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-2 mt-6 pb-8">
                <button
                  type="button"
                  onClick={() => setSelectedMarket(null)}
                  className="bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold py-3 px-4 rounded-xl text-xs transition-all"
                >
                  {t.common_cancel}
                </button>
                <button
                  type="button"
                  onClick={handlePredict}
                  disabled={loading || amount <= 0}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                >
                  {loading ? t.common_processing : t.predict_confirm}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
