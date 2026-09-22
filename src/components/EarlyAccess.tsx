"use client";

import React, { useState } from "react";
import { ArrowRight, CheckCircle2, Loader2, MailCheck } from "lucide-react";

const COUNTRIES = [
  "Kenya", "Uganda", "Tanzania", "Rwanda", "Nigeria", "Ghana", "South Africa",
  "DRC", "Morocco", "Egypt", "Senegal", "Côte d'Ivoire", "Angola", "Mozambique",
  "Ethiopia", "Zambia", "Zimbabwe", "Other",
];

const INTERESTS = ["I want to predict", "I want to run a Chama pool", "I'm a developer / partner", "Other"];

const PERKS = ["No card required", "Works on feature phones", "Cash out to mobile money"];

export default function EarlyAccess() {
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("Kenya");
  const [interest, setInterest] = useState(INTERESTS[0]);
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState<"idle" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setState("idle");
    try {
      const res = await fetch("/api/early-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), country, interest }),
      });
      const json = await res.json();
      if (json.success) {
        setState("done");
        setMessage(json.message);
      } else {
        setState("error");
        setMessage(json.error || "Something went wrong. Please try again.");
      }
    } catch {
      setState("error");
      setMessage("Network error. Please try again.");
    }
    setLoading(false);
  };

  const input =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500/60 dark:border-white/[.08] dark:bg-black/30 dark:text-white dark:placeholder:text-slate-600 [&>option]:bg-white dark:[&>option]:bg-[#0a1511]";

  return (
    <section className="px-5 py-24 sm:py-28 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        {state === "done" ? (
          <div className="rounded-[2rem] border border-emerald-500/20 bg-emerald-50 dark:bg-emerald-400/[.05] px-6 py-14">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-400">
              <MailCheck className="h-7 w-7" />
            </span>
            <h2 className="mt-6 text-3xl font-black tracking-[-.03em] text-slate-900 dark:text-white sm:text-4xl">You&apos;re on the list!</h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-slate-500 dark:text-slate-400">{message}</p>
          </div>
        ) : (
          <>
            <h2 className="text-3xl font-black leading-tight tracking-[-.03em] text-slate-900 dark:text-white sm:text-5xl">
              <span className="block">Be first when Arena opens</span>
              <span className="block bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-500 dark:from-emerald-300 dark:via-emerald-400 dark:to-teal-300 bg-clip-text text-transparent">
                in your country
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              Join the early access list. We roll out country by country as mobile money and
              USSD short-code approvals land.
            </p>

            <form onSubmit={submit} className="mx-auto mt-8 max-w-xl space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={`${input} flex-1`}
                  aria-label="Email address"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 text-xs font-black text-emerald-950 transition hover:bg-emerald-300 disabled:opacity-60"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                    <>Get early access <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <select value={country} onChange={(e) => setCountry(e.target.value)} className={input} aria-label="Country">
                  {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={interest} onChange={(e) => setInterest(e.target.value)} className={input} aria-label="What you want to do">
                  {INTERESTS.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>

              {state === "error" && (
                <p className="rounded-xl border border-rose-500/20 bg-rose-50 dark:bg-rose-400/[.06] px-3 py-2 text-[11px] text-rose-700 dark:text-rose-300">{message}</p>
              )}
            </form>

            <p className="mt-4 text-[11px] text-slate-500 dark:text-slate-600">
              No spam. We email once when early access opens in your country.
            </p>
          </>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-7 gap-y-3">
          {PERKS.map((perk) => (
            <span key={perk} className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> {perk}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
