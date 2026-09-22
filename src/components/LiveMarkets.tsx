"use client";

import Link from "next/link";
import { ArrowRight, Globe2 } from "lucide-react";
import { formatNumber } from "@/lib/i18n-format";
import { useLocale } from "@/lib/locale-context";

export interface LiveMarket {
  id: number;
  title: string;
  category: string;
  locale: string;
  oddsYes: number;
  oddsNo: number;
  volume: number;
}

interface LiveMarketsProps {
  markets: LiveMarket[];
  openMarketsCount: number;
}

const CATEGORY_STYLE: Record<string, string> = {
  crypto: "text-emerald-600 dark:text-emerald-400",
  tech: "text-sky-600 dark:text-sky-400",
  sports: "text-amber-600 dark:text-amber-400",
  culture: "text-fuchsia-600 dark:text-fuchsia-400",
  economy: "text-teal-600 dark:text-teal-400",
  politics: "text-indigo-600 dark:text-indigo-400",
  climate: "text-lime-600 dark:text-lime-400",
};

export default function LiveMarkets({ markets, openMarketsCount }: LiveMarketsProps) {
  const { locale } = useLocale();
  return (
    <section id="markets" className="relative border-y border-slate-200 bg-white py-20 dark:border-white/[.07] dark:bg-[#08110d] sm:py-24">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        {/* Header row */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[.22em] text-emerald-600 dark:text-emerald-400">Live Markets</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-.035em] text-slate-900 dark:text-white sm:text-5xl">
              Local stories. <span className="text-slate-500">Global stakes.</span>
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              {openMarketsCount} open markets spanning economy, sport, politics, crypto, tech, climate and culture.
            </p>
          </div>
          <Link href="/dashboard" className="group inline-flex flex-shrink-0 items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 transition hover:text-emerald-500 dark:hover:text-emerald-300">
            View all markets
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Board */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {markets.slice(0, 6).map((market) => (
            <Link
              key={market.id}
              href="/dashboard"
              className="group flex flex-col rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-1 hover:border-emerald-500/30 hover:bg-white dark:border-white/[.07] dark:bg-[#0b1612] dark:hover:border-emerald-400/25 dark:hover:bg-[#0e1a15]"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className={`text-[10px] font-black uppercase tracking-[.18em] ${CATEGORY_STYLE[market.category] || "text-emerald-600 dark:text-emerald-400"}`}>
                  {market.category}
                </span>
                <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-500">
                  <Globe2 className="h-3 w-3" /> {market.locale === "global" ? "Global" : "Regional"}
                </span>
              </div>

              <h3 className="flex-1 text-sm font-bold leading-6 text-slate-900 dark:text-white">
                {market.title}
              </h3>

              <div className="mt-6 flex items-center justify-between border-t border-slate-200 dark:border-white/[.06] pt-4">
                <span className="text-[11px] font-mono text-slate-500">
                  KSh {formatNumber(market.volume, {}, locale)}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="rounded-md bg-emerald-50 dark:bg-emerald-400/10 px-2 py-1 text-[10px] font-black text-emerald-700 dark:text-emerald-400">
                    YES {market.oddsYes.toFixed(2)}x
                  </span>
                  <span className="rounded-md bg-rose-50 dark:bg-rose-400/10 px-2 py-1 text-[10px] font-black text-rose-700 dark:text-rose-400">
                    NO {market.oddsNo.toFixed(2)}x
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
