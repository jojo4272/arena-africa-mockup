"use client";

import React, { useState, useEffect } from "react";
import { Wallet, ArrowDownCircle, ArrowUpCircle, CreditCard, Smartphone } from "lucide-react";
import { formatNumber } from "@/lib/i18n-format";
import { useLocale } from "@/lib/locale-context";

interface Props {
  user: any;
  refresh: () => void;
  currencySymbol: string;
}

export default function MobileWalletScreen({ user, refresh, currencySymbol }: Props) {
  const { locale } = useLocale();
  const [action, setAction] = useState<"deposit" | "withdraw" | null>(null);
  const [amount, setAmount] = useState<number>(1000);
  const [provider, setProvider] = useState<string>("M-PESA");
  const [phone, setPhone] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    setPhone(user?.phoneNumber || "");
    if (user?.currency === "UGX" || user?.currency === "RWF") setProvider("MTN_MOMO");
    else if (user?.currency === "TZS") setProvider("AIRTEL_MONEY");
    else setProvider("M-PESA");
    loadTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadTransactions = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/wallet/transactions?userId=${user.id}`);
      const json = await res.json();
      if (json.success) setTransactions(json.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAction = async () => {
    setLoading(true);
    const endpoint = action === "deposit" ? "/api/wallet/deposit" : "/api/wallet/withdraw";
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          amount,
          currency: user.currency,
          provider,
          phoneNumber: phone,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setNotification(`${action === "deposit" ? "Deposited" : "Withdrawn"} ${currencySymbol} ${amount}. Ref: ${json.data.reference}`);
        setAction(null);
        refresh();
        loadTransactions();
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

      {/* Header */}
      <div className="mb-4">
        <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
          <Wallet className="w-5 h-5 text-emerald-400" />
          My Wallet
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">Manage your Mobile Money funds</p>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-5 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10">
          <Wallet className="w-40 h-40 -mr-10 -mt-10" />
        </div>
        
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] opacity-80 uppercase tracking-widest">Total Balance</span>
          <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded-full font-bold">{user?.country}</span>
        </div>
        <div className="text-3xl font-black">
          {currencySymbol} {user?.balance ? formatNumber(user?.balance, {}, locale) : 0}
        </div>
        <div className="text-[10px] opacity-70 font-mono mt-1">
          Linked to: {user?.phoneNumber}
        </div>

        <div className="grid grid-cols-2 gap-2 mt-5">
          <button
            onClick={() => {
              setAction("deposit");
              setAmount(user?.currency === "KES" ? 1000 : (user?.currency === "UGX" ? 30000 : 20000));
            }}
            className="bg-white/20 backdrop-blur hover:bg-white/30 p-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all"
          >
            <ArrowDownCircle className="w-4 h-4" /> Deposit
          </button>
          <button
            onClick={() => {
              setAction("withdraw");
              setAmount(user?.currency === "KES" ? 500 : (user?.currency === "UGX" ? 15000 : 10000));
            }}
            className="bg-white/20 backdrop-blur hover:bg-white/30 p-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all"
          >
            <ArrowUpCircle className="w-4 h-4" /> Withdraw
          </button>
        </div>
      </div>

      {/* Transactions */}
      <div className="mt-6">
        <h3 className="text-sm font-extrabold text-white mb-3 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-slate-400" />
          Recent Transactions
        </h3>

        <div className="space-y-2">
          {transactions.length === 0 ? (
            <div className="bg-slate-800 rounded-2xl p-6 text-center text-xs text-slate-400">
              No transactions yet
            </div>
          ) : (
            transactions.slice(0, 8).map((tx) => {
              const isDeposit = tx.type === "DEPOSIT" || tx.type === "PREDICT_PAYOUT";
              return (
                <div key={tx.id} className="bg-slate-800 p-3 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl ${
                      isDeposit ? "bg-emerald-950 text-emerald-400" : "bg-rose-950 text-rose-400"
                    }`}>
                      {tx.type === "DEPOSIT" ? <ArrowDownCircle className="w-4 h-4" /> : 
                       tx.type === "WITHDRAWAL" ? <ArrowUpCircle className="w-4 h-4" /> :
                       <Smartphone className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{tx.type.replace(/_/g, " ")}</p>
                      <p className="text-[9px] text-slate-500 font-mono">Ref: {tx.reference}</p>
                    </div>
                  </div>
                  <span className={`font-black text-sm ${isDeposit ? "text-emerald-400" : "text-rose-400"}`}>
                    {isDeposit ? "+" : "-"}{currencySymbol} {formatNumber(tx.amount, {}, locale)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Action Modal */}
      {action && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-end justify-center">
          <div className="bg-slate-900 w-full rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-center pt-1 pb-3">
              <div className="w-12 h-1 bg-slate-700 rounded-full"></div>
            </div>

            <h3 className="text-base font-extrabold text-white mb-4">
              {action === "deposit" ? "Deposit Funds" : "Withdraw Funds"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Provider:</label>
                <div className="grid grid-cols-3 gap-2">
                  {["M-PESA", "MTN_MOMO", "AIRTEL_MONEY"].map((prov) => (
                    <button
                      key={prov}
                      onClick={() => setProvider(prov)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        provider === prov 
                          ? "bg-emerald-500/20 border-emerald-400 text-emerald-400" 
                          : "bg-slate-950 text-slate-400 border-slate-800"
                      }`}
                    >
                      {prov.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Phone Number:</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-950 text-white text-xs border border-slate-800 rounded-xl p-2.5 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Amount:</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-950 text-white text-xs border border-slate-800 rounded-xl p-2.5 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-6 pb-4">
              <button
                onClick={() => setAction(null)}
                className="bg-slate-800 text-slate-300 font-bold py-3 px-4 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={loading}
                className="bg-emerald-500 text-slate-950 font-extrabold py-3 px-4 rounded-xl text-xs"
              >
                {loading ? "Processing..." : action === "deposit" ? "Deposit" : "Withdraw"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
