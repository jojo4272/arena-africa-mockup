"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Gift,
  Globe2,
  Loader2,
  LogIn,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
  X,
  Zap,
} from "lucide-react";
import { flagFor, money } from "@/lib/localization";

// Tab button component - declared outside to avoid recreation on each render
const TabBtn = ({
  id,
  icon: Icon,
  label: text,
  tab,
  setTab,
  setError
}: {
  id: "create" | "signin" | "demo";
  icon: React.ElementType;
  label: string;
  tab: "create" | "signin" | "demo";
  setTab: (t: "create" | "signin" | "demo") => void;
  setError: (e: string | null) => void;
}) => (
  <button
    type="button"
    role="tab"
    aria-selected={tab === id}
    onClick={() => { setTab(id); setError(null); }}
    className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-[11px] font-extrabold transition ${
      tab === id ? "bg-emerald-400 text-emerald-950 shadow-lg shadow-emerald-400/20" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
    }`}
  >
    <Icon className="h-3.5 w-3.5" /> {text}
  </button>
);

export interface DemoUser {
  id: number;
  name: string;
  country: string;
  currency: string;
  phoneNumber: string;
  role?: string;
  balance?: number;
}

interface LoginFlowProps {
  users: DemoUser[];
  className?: string;
  children: React.ReactNode;
}

interface GeoData {
  countryCode: string;
  country: string;
  currency: string;
  dialCode: string;
  region: string;
  source: string;
  welcomeBonus: number;
  restricted: boolean;
  supportedCountries: Array<{ code: string; country: string; currency: string; dialCode: string; region: string }>;
}

type Tab = "signin" | "create" | "demo";

const ROLE_TONE: Record<string, string> = {
  ADMIN: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-400/10 dark:text-rose-300 dark:border-rose-400/20",
  CREATOR: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-400/10 dark:text-sky-300 dark:border-sky-400/20",
  RESOLVER: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-400/10 dark:text-violet-300 dark:border-violet-400/20",
  COMPLIANCE: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-400/10 dark:text-amber-300 dark:border-amber-400/20",
  TREASURY: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-400/10 dark:text-teal-300 dark:border-teal-400/20",
  MEMBER: "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-400/10 dark:text-slate-400 dark:border-white/10",
};

export default function LoginFlow({ users, className, children }: LoginFlowProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("create");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Geo automation
  const [geo, setGeo] = useState<GeoData | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [countryTouched, setCountryTouched] = useState(false);

  // Forms
  const [phone, setPhone] = useState("");
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [countryCode, setCountryCode] = useState("KE");
  const [query, setQuery] = useState("");
  const [profileBusy, setProfileBusy] = useState<number | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  /* ---------------- Geo detection on open ---------------- */
  useEffect(() => {
    if (!open || geo) return;
    setGeoLoading(true);
    fetch("/api/geo")
      .then((r) => r.json())
      .then((j) => {
        if (j.success) {
          setGeo(j.data);
          if (!countryTouched) {
            setCountryCode(j.data.countryCode);
            if (!newPhone) setNewPhone(j.data.dialCode + " ");
          }
        }
      })
      .catch(() => undefined)
      .finally(() => setGeoLoading(false));
  }, [open, geo, countryTouched, newPhone]);

  /* ---------------- Modal a11y: focus trap, ESC, scroll lock ---------------- */
  useEffect(() => {
    if (!open) {
      setError(null);
      setSuccess(null);
      setBusy(false);
      setProfileBusy(null);
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return setOpen(false);
      if (e.key !== "Tab" || !dialogRef.current) return;
      const nodes = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]),input:not([disabled]),select:not([disabled]),a[href]'
      );
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setTimeout(() => firstFieldRef.current?.focus(), 60);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, tab]);

  const selectedCountry = useMemo(
    () => geo?.supportedCountries.find((c) => c.code === countryCode),
    [geo, countryCode]
  );

  const enter = useCallback(
    (msg: string) => {
      setSuccess(msg);
      setTimeout(() => router.push("/dashboard"), 500);
    },
    [router]
  );

  /* ---------------- Actions ---------------- */
  const doSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^\+?[\d\s-]{7,18}$/.test(phone.trim())) {
      return setError("Enter a valid phone number, e.g. +254712345678.");
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phone.replace(/[\s-]/g, "") }),
      });
      const j = await res.json();
      if (j.success) enter(`Welcome back, ${j.user.name.split(" ")[0]} — opening your dashboard…`);
      else {
        setError("No account for that number yet. Let's create one — it takes one step.");
        setNewPhone(phone);
        setTab("create");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setBusy(false);
  };

  const doCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newName.trim().length < 2) return setError("Please enter your full name.");
    if (!/^\+?[\d\s-]{7,18}$/.test(newPhone.trim())) return setError("Enter a valid phone number.");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          phoneNumber: newPhone.replace(/[\s-]/g, ""),
          countryCode,
          channel: "WEB",
        }),
      });
      const j = await res.json();
      if (j.success) {
        enter(`Account created — ${money(j.automation.welcomeBonus, j.automation.appliedCurrency)} welcome balance added.`);
      } else if (j.code === "ALREADY_REGISTERED") {
        setError("That number already has an account. Switching you to sign in.");
        setPhone(newPhone);
        setTab("signin");
      } else {
        setError(j.error || "Could not create the account.");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setBusy(false);
  };

  const doDemo = async (id: number) => {
    setError(null);
    setProfileBusy(id);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id }),
      });
      const j = await res.json();
      if (j.success) enter(`Signed in as ${j.user.name} — opening your dashboard…`);
      else setError(j.error || "Could not start the session.");
    } catch {
      setError("Network error. Please try again.");
    }
    setProfileBusy(null);
  };

  const filtered = users.filter(
    (u) => !query.trim() || `${u.name} ${u.country} ${u.currency} ${u.role ?? ""}`.toLowerCase().includes(query.toLowerCase())
  );

  const field =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-emerald-500/70 focus:outline-none focus:ring-2 focus:ring-emerald-500/15 dark:border-white/10 dark:bg-black/40 dark:text-white dark:placeholder:text-slate-600 [&>option]:bg-white dark:[&>option]:bg-[#0a1511]";
  const label = "mb-1.5 block text-[10px] font-black uppercase tracking-[.14em] text-slate-500";

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {children}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-slate-900/50 dark:bg-slate-950/70 p-4 backdrop-blur-md"
          onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-title"
            className="relative my-auto w-full max-w-lg overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_40px_120px_rgba(0,0,0,.25)] dark:border-white/10 dark:bg-[#0a1511] dark:shadow-[0_40px_120px_rgba(0,0,0,.7)]"
          >
            {/* Header */}
            <div className="relative overflow-hidden border-b border-slate-200 dark:border-white/[.07] px-6 py-5">
              <div className="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full bg-emerald-400/10 blur-2xl" />
              <div className="relative flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-400 text-emerald-950">
                    <Sparkles className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 id="auth-title" className="text-base font-black tracking-tight text-slate-900 dark:text-white">Open the platform</h2>
                    <p className="mt-0.5 text-[11px] text-slate-500">One account across web, mobile, USSD and payments</p>
                  </div>
                </div>
                <button onClick={() => setOpen(false)} className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/5 dark:hover:text-white" aria-label="Close">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Geo automation banner */}
              <div className="relative mt-4 flex items-center gap-2.5 rounded-xl border border-emerald-500/15 bg-emerald-50 dark:bg-emerald-400/[.05] px-3 py-2.5">
                {geoLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 flex-shrink-0 animate-spin text-emerald-600 dark:text-emerald-400" />
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Detecting your location…</span>
                  </>
                ) : geo ? (
                  <>
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span className="min-w-0 flex-1 text-[11px] text-slate-600 dark:text-slate-300">
                      Detected <strong className="text-slate-900 dark:text-white">{flagFor(geo.country)} {geo.country}</strong> — currency set to{" "}
                      <strong className="text-emerald-600 dark:text-emerald-400">{geo.currency}</strong>
                    </span>
                    <span className="flex-shrink-0 rounded-full bg-white dark:bg-black/30 px-2 py-0.5 text-[8px] font-mono uppercase text-slate-500">
                      via {geo.source}
                    </span>
                  </>
                ) : (
                  <>
                    <Globe2 className="h-3.5 w-3.5 flex-shrink-0 text-slate-500" />
                    <span className="text-[11px] text-slate-500">Choose your country below.</span>
                  </>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div role="tablist" className="flex gap-1.5 border-b border-slate-200 dark:border-white/[.07] p-3">
              <TabBtn id="create" icon={UserPlus} label="Create account" tab={tab} setTab={setTab} setError={setError} />
              <TabBtn id="signin" icon={LogIn} label="Sign in" tab={tab} setTab={setTab} setError={setError} />
              <TabBtn id="demo" icon={Users} label="Demo profiles" tab={tab} setTab={setTab} setError={setError} />
            </div>

            <div className="px-6 py-5">
              {/* ---------- CREATE ---------- */}
              {tab === "create" && (
                <form onSubmit={doCreate} className="space-y-4">
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-500/15 bg-emerald-50 dark:bg-emerald-400/[.04] px-3 py-2">
                    <Zap className="h-3.5 w-3.5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Automated setup — currency, language and dial code are applied from your location.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="rf-name" className={label}>Full name</label>
                    <input id="rf-name" ref={firstFieldRef} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Amara Okafor" className={field} autoComplete="name" />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1.1fr_1fr]">
                    <div>
                      <label htmlFor="rf-country" className={label}>Country</label>
                      <select
                        id="rf-country"
                        value={countryCode}
                        onChange={(e) => {
                          setCountryTouched(true);
                          setCountryCode(e.target.value);
                          const c = geo?.supportedCountries.find((x) => x.code === e.target.value);
                          if (c) setNewPhone(c.dialCode + " ");
                        }}
                        className={field}
                      >
                        {(geo?.supportedCountries ?? [{ code: "KE", country: "Kenya", currency: "KES", dialCode: "+254", region: "East Africa" }]).map((c) => (
                          <option key={c.code} value={c.code}>{c.country} · {c.currency}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="rf-phone" className={label}>Phone number</label>
                      <div className="relative">
                        <Phone className="pointer-events-none absolute left-3 top-3.5 h-3.5 w-3.5 text-slate-400 dark:text-slate-600" />
                        <input id="rf-phone" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="+254 712 345678" className={`${field} pl-9`} autoComplete="tel" />
                      </div>
                    </div>
                  </div>

                  {/* Automation preview */}
                  <div className="grid grid-cols-3 gap-2 rounded-xl border border-slate-200 bg-slate-50 dark:border-white/[.07] dark:bg-black/20 p-3">
                    {[
                      { icon: Globe2, k: "Currency", v: selectedCountry?.currency ?? geo?.currency ?? "KES" },
                      { icon: MapPin, k: "Region", v: selectedCountry?.region ?? geo?.region ?? "East Africa" },
                      { icon: Gift, k: "Welcome", v: geo ? money(geo.welcomeBonus, selectedCountry?.currency ?? geo.currency) : "—" },
                    ].map((s) => (
                      <div key={s.k}>
                        <p className="flex items-center gap-1 text-[8px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-600">
                          <s.icon className="h-2.5 w-2.5" /> {s.k}
                        </p>
                        <p className="mt-1 truncate text-[11px] font-bold text-emerald-400">{s.v}</p>
                      </div>
                    ))}
                  </div>

                  {geo?.restricted && (
                    <p className="rounded-xl border border-amber-400/20 bg-amber-400/[.06] px-3 py-2 text-[11px] text-amber-300">
                      Staking isn&apos;t licensed in {geo.country} yet — you can browse markets, and we&apos;ll email you at launch.
                    </p>
                  )}

                  <button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 py-3.5 text-sm font-black text-emerald-950 transition hover:bg-emerald-300 disabled:opacity-50">
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Create account & enter <ArrowRight className="h-4 w-4" /></>}
                  </button>
                  <p className="text-center text-[10px] text-slate-400 dark:text-slate-600">No card required · Demo wallet funded instantly</p>
                </form>
              )}

              {/* ---------- SIGN IN ---------- */}
              {tab === "signin" && (
                <form onSubmit={doSignIn} className="space-y-4">
                  <div>
                    <label htmlFor="si-phone" className={label}>Phone number</label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-3.5 h-3.5 w-3.5 text-slate-400 dark:text-slate-600" />
                      <input id="si-phone" ref={firstFieldRef} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={`${geo?.dialCode ?? "+254"} 712 345678`} className={`${field} pl-9`} autoComplete="tel" />
                    </div>
                    <p className="mt-1.5 text-[10px] text-slate-400 dark:text-slate-600">Your phone number is your identity — the same login works on USSD.</p>
                  </div>

                  <button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 py-3.5 text-sm font-black text-emerald-950 transition hover:bg-emerald-300 disabled:opacity-50">
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Continue <ArrowRight className="h-4 w-4" /></>}
                  </button>

                  <div className="grid grid-cols-3 gap-2 border-t border-slate-200 dark:border-white/[.07] pt-4">
                    {["HMAC-signed session", "httpOnly cookie", "Rate limited"].map((s) => (
                      <span key={s} className="flex items-center gap-1 text-[9px] font-semibold text-slate-400 dark:text-slate-600">
                        <ShieldCheck className="h-3 w-3 flex-shrink-0 text-emerald-400/70" /> {s}
                      </span>
                    ))}
                  </div>
                </form>
              )}

              {/* ---------- DEMO PROFILES ---------- */}
              {tab === "demo" && (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-3 h-3.5 w-3.5 text-slate-400 dark:text-slate-600" />
                    <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, country or role…" className={`${field} py-2.5 pl-9 text-xs`} />
                  </div>

                  <p className="text-[10px] text-slate-400 dark:text-slate-600">
                    Each profile carries a different role so you can see the capability model in action.
                  </p>

                  <div className="max-h-[17rem] space-y-1.5 overflow-y-auto pr-1">
                    {filtered.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        disabled={profileBusy !== null}
                        onClick={() => doDemo(u.id)}
                        className="group flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left transition hover:border-emerald-500/30 hover:bg-white dark:border-white/[.06] dark:bg-white/[.02] dark:hover:bg-white/[.05] disabled:opacity-40"
                      >
                        <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg bg-slate-200 dark:bg-black/40 text-base">{flagFor(u.country)}</span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5">
                            <span className="truncate text-xs font-bold text-slate-900 dark:text-white">{u.name}</span>
                            {u.role && (
                              <span className={`flex-shrink-0 rounded border px-1.5 py-px text-[8px] font-black uppercase tracking-wider ${ROLE_TONE[u.role] ?? ROLE_TONE.MEMBER}`}>
                                {u.role}
                              </span>
                            )}
                          </span>
                          <span className="mt-0.5 block truncate text-[10px] font-mono text-slate-500">
                            {u.country} · {u.currency}
                            {u.balance != null && ` · ${money(u.balance, u.currency)}`}
                          </span>
                        </span>
                        {profileBusy === u.id ? (
                          <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin text-emerald-400" />
                        ) : (
                          <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 text-slate-400 dark:text-slate-700 transition group-hover:translate-x-0.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
                        )}
                      </button>
                    ))}
                    {filtered.length === 0 && <p className="py-8 text-center text-xs text-slate-400 dark:text-slate-600">No matching profile.</p>}
                  </div>
                </div>
              )}

              {/* Feedback */}
              {error && (
                <p role="alert" className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/[.07] px-3 py-2.5 text-[11px] leading-4 text-rose-300">{error}</p>
              )}
              {success && (
                <p role="status" className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[.07] px-3 py-2.5 text-[11px] text-emerald-300">
                  <BadgeCheck className="h-4 w-4 flex-shrink-0" /> {success}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t border-slate-200 bg-slate-50 dark:border-white/[.07] dark:bg-black/20 px-6 py-3">
              {["Policy-gated", "Geo-aware", "4 languages"].map((s) => (
                <span key={s} className="flex items-center gap-1 text-[9px] font-semibold text-slate-400 dark:text-slate-600">
                  <Check className="h-2.5 w-2.5 text-emerald-400/70" /> {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
