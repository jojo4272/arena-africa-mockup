"use client";

import React, { useState, useEffect } from "react";
import { User, Globe, Smartphone, MapPin, Award, LogOut } from "lucide-react";
import { LOCALE_NAMES, LOCALE_FLAGS, type Locale } from "@/lib/i18n";

interface Props {
  user: any;
  userId: number;
  setUserId: (id: number) => void;
  locale: Locale;
  setLocale: (l: Locale) => void;
}

const countryFlags: { [key: string]: string } = {
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

export default function MobileProfileScreen({ user, userId, setUserId, locale, setLocale }: Props) {
  const [users, setUsers] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);

  const loadUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const json = await res.json();
      if (json.success) setUsers(json.data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadPredictions = async () => {
    try {
      const res = await fetch(`/api/predictions?userId=${userId}`);
      const json = await res.json();
      if (json.success) setPredictions(json.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadUsers();
    loadPredictions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const won = predictions.filter(p => p.marketStatus === "RESOLVED" && p.winningOutcome === p.prediction.outcome).length;
  const lost = predictions.filter(p => p.marketStatus === "RESOLVED" && p.winningOutcome !== p.prediction.outcome).length;
  const pending = predictions.filter(p => p.marketStatus !== "RESOLVED").length;

  return (
    <div className="flex flex-col p-4">
      
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-5 text-white relative overflow-hidden mb-4">
        <div className="absolute top-0 right-0 opacity-10">
          <User className="w-40 h-40 -mr-10 -mt-10" />
        </div>
        
        <div className="flex items-center gap-3 mb-3">
          <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-2xl font-black">
            {user?.name?.[0] || "U"}
          </div>
          <div className="flex-1">
            <p className="text-[10px] opacity-80 uppercase tracking-widest">Active Profile</p>
            <p className="text-lg font-extrabold">{user?.name}</p>
            <p className="text-[10px] opacity-70 font-mono">{user?.phoneNumber}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="bg-white/15 backdrop-blur p-2 rounded-xl text-center">
            <p className="text-[9px] opacity-80 uppercase">Won</p>
            <p className="text-lg font-black">{won}</p>
          </div>
          <div className="bg-white/15 backdrop-blur p-2 rounded-xl text-center">
            <p className="text-[9px] opacity-80 uppercase">Lost</p>
            <p className="text-lg font-black">{lost}</p>
          </div>
          <div className="bg-white/15 backdrop-blur p-2 rounded-xl text-center">
            <p className="text-[9px] opacity-80 uppercase">Open</p>
            <p className="text-lg font-black">{pending}</p>
          </div>
        </div>
      </div>

      {/* Account Info */}
      <div className="bg-slate-800 rounded-2xl p-4 mb-4">
        <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">Account</h3>
        <div className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5" /> Country
            </span>
            <span className="text-white font-bold flex items-center gap-1">
              {countryFlags[user?.country]} {user?.country}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-2">
              <Smartphone className="w-3.5 h-3.5" /> Phone
            </span>
            <span className="text-white font-mono font-bold">{user?.phoneNumber}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-2">
              <Award className="w-3.5 h-3.5" /> Currency
            </span>
            <span className="text-white font-bold">{user?.currency}</span>
          </div>
        </div>
      </div>

      {/* Language Switcher */}
      <div className="bg-slate-800 rounded-2xl p-4 mb-4">
        <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5" /> App Language
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {(["en", "sw", "fr", "pt"] as Locale[]).map((l) => (
            <button
              key={l}
              onClick={() => setLocale(l)}
              className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                locale === l
                  ? "bg-emerald-500/20 border-emerald-400 text-emerald-400"
                  : "bg-slate-950 border-slate-700 text-slate-400"
              }`}
            >
              <span>{LOCALE_FLAGS[l]}</span>
              <span>{LOCALE_NAMES[l]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Profile Switcher */}
      <div className="bg-slate-800 rounded-2xl p-4 mb-4">
        <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <LogOut className="w-3.5 h-3.5" /> Switch Demo Profile
        </h3>
        <div className="space-y-2">
          {users.map((u) => (
            <button
              key={u.id}
              onClick={() => setUserId(u.id)}
              className={`w-full p-3 rounded-xl text-left flex items-center justify-between transition-all ${
                userId === u.id
                  ? "bg-emerald-500/20 border border-emerald-400"
                  : "bg-slate-950 border border-slate-700"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${
                  userId === u.id ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-400"
                }`}>
                  {u.name[0]}
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{u.name}</p>
                  <p className="text-[10px] text-slate-500">{countryFlags[u.country]} {u.country} · {u.currency}</p>
                </div>
              </div>
              {userId === u.id && (
                <span className="text-[10px] bg-emerald-500 text-slate-950 font-black px-2 py-0.5 rounded-full">ACTIVE</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Recent Predictions */}
      <div className="bg-slate-800 rounded-2xl p-4">
        <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">Recent Predictions</h3>
        {predictions.length === 0 ? (
          <div className="text-center py-4 text-xs text-slate-500">
            No predictions yet
          </div>
        ) : (
          <div className="space-y-2">
            {predictions.slice(0, 5).map((p) => {
              const isOver = p.marketStatus === "RESOLVED";
              const won = isOver && p.winningOutcome === p.prediction.outcome;
              
              return (
                <div key={p.prediction.id} className="bg-slate-950 p-2.5 rounded-xl">
                  <p className="text-[11px] font-bold text-white line-clamp-1">{p.marketTitle}</p>
                  <div className="flex items-center justify-between mt-1 text-[10px]">
                    <span className={`px-1.5 py-0.5 rounded font-black uppercase ${
                      p.prediction.outcome === "YES" ? "bg-emerald-950 text-emerald-400" : "bg-rose-950 text-rose-400"
                    }`}>
                      {p.prediction.outcome}
                    </span>
                    <span className="text-slate-400 font-mono">{p.prediction.amount} {p.prediction.currency}</span>
                    {!isOver ? (
                      <span className="text-slate-500">Open</span>
                    ) : won ? (
                      <span className="text-emerald-400 font-bold">Won ✓</span>
                    ) : (
                      <span className="text-rose-400 font-bold">Lost</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-6 text-center text-[10px] text-slate-500 pb-4">
        Arena Africa Mobile v1.0<br />
        © 2026 Arena Inc.
      </div>
    </div>
  );
}
