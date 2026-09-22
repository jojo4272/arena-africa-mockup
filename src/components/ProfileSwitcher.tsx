"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Search, UserCog } from "lucide-react";
import { flagFor, money } from "@/lib/localization";

interface ProfileSwitcherProps {
  users: any[];
  currentUserId?: number;
  onSelect: (userId: number) => void;
  /** Compact = header pill, full = larger card (mobile) */
  variant?: "compact" | "full";
  label?: string;
}

/**
 * Click-to-open dropdown for switching the active demo profile.
 * Closes on outside click and Escape; keyboard accessible.
 */
export default function ProfileSwitcher({
  users,
  currentUserId,
  onSelect,
  variant = "compact",
  label = "Demo profile",
}: ProfileSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const active = users.find((u) => u.id === currentUserId) || users[0];

  // Outside click closes
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 30);
    if (!open) setQuery("");
  }, [open]);

  const filtered = users.filter(
    (u) =>
      !query.trim() ||
      `${u.name} ${u.country} ${u.currency} ${u.phoneNumber}`.toLowerCase().includes(query.toLowerCase())
  );

  if (!active) return null;

  return (
    <div ref={rootRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`group flex items-center gap-2.5 rounded-2xl border transition-all text-left ${
          variant === "full"
            ? "w-full bg-slate-100 border-slate-200 hover:border-emerald-500/50 p-3 dark:bg-slate-800 dark:border-slate-700"
            : "bg-white border-slate-200 hover:border-emerald-500/50 py-1.5 pl-2 pr-2.5 dark:bg-slate-900 dark:border-slate-800"
        }`}
      >
        <span
          className={`grid place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 flex-shrink-0 ${
            variant === "full" ? "w-10 h-10 text-lg" : "w-7 h-7 text-sm"
          }`}
        >
          {flagFor(active.country)}
        </span>

        <span className="min-w-0">
          <span className="block text-[9px] uppercase tracking-wider text-slate-500 font-bold leading-none mb-0.5">
            {label}
          </span>
          <span
            className={`block font-bold text-slate-900 dark:text-white leading-tight truncate ${
              variant === "full" ? "text-sm" : "text-xs max-w-[120px]"
            }`}
          >
            {active.name}
          </span>
          <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-mono leading-tight mt-0.5">
            {active.country} · {money(active.balance, active.currency)}
          </span>
        </span>

        <ChevronDown
          className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${
            open ? "rotate-180 text-emerald-600 dark:text-emerald-400" : "group-hover:text-slate-600 dark:group-hover:text-slate-200"
          }`}
        />
      </button>

      {/* Menu */}
      {open && (
        <div
          role="listbox"
          className={`absolute z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden dark:border-slate-700 dark:bg-slate-900 ${
            variant === "full" ? "left-0 right-0 w-auto" : "right-0"
          }`}
        >
          <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/60">
            <UserCog className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex-1">
              Switch Demo Profile
            </span>
            <span className="text-[10px] text-slate-500 font-mono">{users.length}</span>
          </div>

          {/* Search */}
          <div className="p-2 border-b border-slate-200 dark:border-slate-800">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-500" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, country, currency…"
                className="w-full bg-slate-100 text-xs text-slate-900 pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500/60 dark:bg-slate-950 dark:text-white dark:border-slate-800"
              />
            </div>
          </div>

          {/* Options */}
          <div className="max-h-72 overflow-y-auto p-1.5 space-y-0.5">
            {filtered.length === 0 && (
              <p className="px-3 py-6 text-center text-xs text-slate-500">No matching profile</p>
            )}

            {filtered.map((u) => {
              const isActive = u.id === currentUserId;
              return (
                <button
                  key={u.id}
                  role="option"
                  aria-selected={isActive}
                  type="button"
                  onClick={() => {
                    onSelect(u.id);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 text-left px-2.5 py-2 rounded-xl transition-colors ${
                    isActive
                      ? "bg-emerald-500/15 ring-1 ring-emerald-500/40"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <span className="text-base leading-none flex-shrink-0">{flagFor(u.country)}</span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-bold text-slate-900 dark:text-white truncate">
                      {u.name}
                      {isActive && (
                        <span className="ml-1.5 text-[9px] text-emerald-600 dark:text-emerald-400 font-black uppercase">Active</span>
                      )}
                    </span>
                    <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate mt-0.5">
                      {u.phoneNumber} · {u.currency}
                    </span>
                  </span>

                  <span className="text-[10px] font-mono text-slate-600 dark:text-slate-300 flex-shrink-0 text-right">
                    {money(u.balance, u.currency)}
                  </span>

                  {isActive && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-200 dark:bg-slate-950/60 dark:border-slate-800">
            <p className="text-[9px] text-slate-500">
              Selecting a profile starts a new session and resets the USSD simulator.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
