"use client";

import React, { useState } from "react";
import { Users, Plus, Copy, CheckCircle2 } from "lucide-react";
import { formatNumber } from "@/lib/i18n-format";
import { useLocale } from "@/lib/locale-context";

interface Props {
  user: any;
  chamas: any[];
  markets: any[];
  refresh: () => void;
  currencySymbol: string;
}

export default function MobileChamaScreen({ user, chamas, markets, refresh, currencySymbol }: Props) {
  const { locale } = useLocale();
  const [mode, setMode] = useState<"list" | "create" | "join">("list");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [marketId, setMarketId] = useState<number>(markets[0]?.id || 1);
  const [outcome, setOutcome] = useState<"YES" | "NO">("YES");
  const [contribution, setContribution] = useState<number>(1000);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/chamas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          marketId,
          code: code.toUpperCase().replace(/\s+/g, ""),
          targetOutcome: outcome,
          userId: user.id,
          contribution,
          currency: user.currency,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setNotification(`Chama "${name}" created! Code: ${code.toUpperCase()}`);
        setName("");
        setCode("");
        setMode("list");
        refresh();
        setTimeout(() => setNotification(null), 4000);
      } else {
        setNotification(json.error);
        setTimeout(() => setNotification(null), 4000);
      }
    } catch (e: any) {
      setNotification(e.message);
    }
    setLoading(false);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/chamas/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.toUpperCase(),
          userId: user.id,
          contribution,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setNotification(`Joined Chama "${json.data.chama.name}" with ${currencySymbol} ${contribution}!`);
        setCode("");
        setMode("list");
        refresh();
        setTimeout(() => setNotification(null), 4000);
      } else {
        setNotification(json.error);
        setTimeout(() => setNotification(null), 4000);
      }
    } catch (e: any) {
      setNotification(e.message);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col p-4">
      
      {notification && (
        <div className="fixed top-20 left-4 right-4 bg-emerald-500 text-slate-950 text-xs font-bold p-3 rounded-xl shadow-lg z-50">
          {notification}
        </div>
      )}

      <div className="mb-4">
        <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-400" />
          Chama Pools
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">Pool predictive capital with friends</p>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={() => setMode("create")}
          className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Start Chama
        </button>
        <button
          onClick={() => setMode("join")}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-700"
        >
          <Users className="w-4 h-4" /> Join Code
        </button>
      </div>

      {/* Active Chamas List */}
      {mode === "list" && (
        <div className="space-y-2">
          {chamas.length === 0 ? (
            <div className="bg-slate-800 rounded-2xl p-6 text-center text-xs text-slate-400">
              No Chamas yet. Create one to get started!
            </div>
          ) : (
            chamas.map((c) => (
              <div key={c.chama.id} className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
                <div className="flex items-start justify-between mb-1.5">
                  <div className="flex-1">
                    <h4 className="text-sm font-extrabold text-white">{c.chama.name}</h4>
                    <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{c.marketTitle}</p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(c.chama.code);
                      setCopied(c.chama.code);
                      setTimeout(() => setCopied(null), 2000);
                    }}
                    className="bg-slate-950 text-slate-300 text-[10px] font-mono font-bold px-2 py-1 rounded-lg flex items-center gap-1 border border-slate-700"
                  >
                    {copied === c.chama.code ? (
                      <><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Copied!</>
                    ) : (
                      <><Copy className="w-3 h-3" /> {c.chama.code}</>
                    )}
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/50 text-[10px]">
                  <span className="text-slate-400">
                    Backing: <strong className={`uppercase ${c.chama.targetOutcome === "YES" ? "text-emerald-400" : "text-rose-400"}`}>
                      {c.chama.targetOutcome}
                    </strong>
                  </span>
                  <span className="text-indigo-400 font-bold">
                    {currencySymbol} {formatNumber(c.chama.totalAmount, {}, locale)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create Chama Form */}
      {mode === "create" && (
        <form onSubmit={handleCreate} className="bg-slate-800 rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-extrabold text-white mb-2">Start a New Chama</h3>
          
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Chama Name (e.g. Kibera Stars)"
            className="w-full bg-slate-950 text-white text-xs border border-slate-700 rounded-xl p-2.5"
          />
          
          <input
            type="text"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Invite Code (e.g. KIBERA-2026)"
            className="w-full bg-slate-950 text-white text-xs border border-slate-700 rounded-xl p-2.5 font-mono uppercase"
          />

          <select
            value={marketId}
            onChange={(e) => setMarketId(Number(e.target.value))}
            className="w-full bg-slate-950 text-white text-xs border border-slate-700 rounded-xl p-2.5"
          >
            {markets.filter(m => m.status === "OPEN").map((m) => (
              <option key={m.id} value={m.id}>
                {m.title.substring(0, 50)}...
              </option>
            ))}
          </select>

          <select
            value={outcome}
            onChange={(e) => setOutcome(e.target.value as "YES" | "NO")}
            className="w-full bg-slate-950 text-white text-xs border border-slate-700 rounded-xl p-2.5"
          >
            <option value="YES">Back YES</option>
            <option value="NO">Back NO</option>
          </select>

          <input
            type="number"
            min="100"
            required
            value={contribution}
            onChange={(e) => setContribution(Math.max(100, parseInt(e.target.value) || 100))}
            placeholder="Your Contribution"
            className="w-full bg-slate-950 text-white text-xs border border-slate-700 rounded-xl p-2.5 font-mono"
          />

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => setMode("list")}
              className="bg-slate-950 text-slate-300 font-bold py-2.5 px-3 rounded-xl text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 text-white font-extrabold py-2.5 px-3 rounded-xl text-xs"
            >
              {loading ? "Creating..." : "Create Chama"}
            </button>
          </div>
        </form>
      )}

      {/* Join Chama Form */}
      {mode === "join" && (
        <form onSubmit={handleJoin} className="bg-slate-800 rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-extrabold text-white mb-2">Join Chama by Code</h3>
          
          <input
            type="text"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter Invite Code"
            className="w-full bg-slate-950 text-white text-xs border border-slate-700 rounded-xl p-2.5 font-mono uppercase"
          />

          <input
            type="number"
            min="100"
            required
            value={contribution}
            onChange={(e) => setContribution(Math.max(100, parseInt(e.target.value) || 100))}
            placeholder="Your Contribution"
            className="w-full bg-slate-950 text-white text-xs border border-slate-700 rounded-xl p-2.5 font-mono"
          />

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => setMode("list")}
              className="bg-slate-950 text-slate-300 font-bold py-2.5 px-3 rounded-xl text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 text-white font-extrabold py-2.5 px-3 rounded-xl text-xs"
            >
              {loading ? "Joining..." : "Join Chama"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
