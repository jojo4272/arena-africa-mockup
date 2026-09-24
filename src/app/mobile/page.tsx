"use client";

import React, { useState, useEffect } from "react";
import { Home, Wallet, Users, User, MessageSquare } from "lucide-react";
import MobileHomeScreen from "./MobileHomeScreen";
import MobileWalletScreen from "./MobileWalletScreen";
import MobileChamaScreen from "./MobileChamaScreen";
import MobileProfileScreen from "./MobileProfileScreen";
import MobileUssdScreen from "./MobileUssdScreen";

type Screen = "home" | "wallet" | "chama" | "ussd" | "profile";

export default function MobileApp() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("home");
  const [locale, setLocale] = useState<"en" | "sw" | "fr" | "pt">("en");
  const [userId, setUserId] = useState<number>(1);
  const [userData, setUserData] = useState<any>(null);
  const [markets, setMarkets] = useState<any[]>([]);
  const [chamas, setChamas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
  };

  useEffect(() => {
    // NIST PROTECT: establish httpOnly session for the selected profile
    const login = async () => {
      try {
        await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
      } catch (e) {
        console.error("Session failed", e);
      }
    };
    login();
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const refreshAll = async () => {
    setLoading(true);
    try {
      const [userRes, marketsRes, chamasRes] = await Promise.all([
        fetch(`/api/users/${userId}`),
        fetch("/api/markets"),
        fetch("/api/chamas"),
      ]);
      const userJson = await userRes.json();
      const marketsJson = await marketsRes.json();
      const chamasJson = await chamasRes.json();

      if (userJson.success) setUserData(userJson.data);
      if (marketsJson.success) setMarkets(marketsJson.data);
      if (chamasJson.success) setChamas(chamasJson.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const navItems: { id: Screen; icon: React.ReactNode; label: string }[] = [
    { id: "home", icon: <Home className="w-5 h-5" />, label: "Home" },
    { id: "chama", icon: <Users className="w-5 h-5" />, label: "Chamas" },
    { id: "ussd", icon: <MessageSquare className="w-5 h-5" />, label: "USSD" },
    { id: "wallet", icon: <Wallet className="w-5 h-5" />, label: "Wallet" },
    { id: "profile", icon: <User className="w-5 h-5" />, label: "Profile" },
  ];

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-0 md:p-4 font-sans">
      
      {/* Mobile Phone Frame */}
      <div className="w-full max-w-[420px] min-h-screen md:min-h-[850px] bg-slate-900 md:rounded-[3rem] md:border-[12px] md:border-slate-950 md:shadow-2xl relative overflow-hidden flex flex-col">
        
        {/* Status Bar */}
        <div className="bg-slate-950 text-slate-400 text-[10px] px-6 py-1.5 flex justify-between items-center font-mono flex-shrink-0">
          <span className="font-bold">9:41</span>
          <div className="flex items-center gap-1.5">
            <span>5G</span>
            <span>●●●</span>
            <span>98%</span>
          </div>
        </div>

        {/* Screen Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide pb-20">
          {loading && !userData ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-pulse text-slate-400 text-sm">Loading Arena...</div>
            </div>
          ) : (
            <>
              {currentScreen === "home" && (
                <MobileHomeScreen
                  user={userData}
                  markets={markets}
                  refresh={refreshAll}
                  currencySymbol={currencySymbols[userData?.currency] || "KSh"}
                />
              )}
              {currentScreen === "wallet" && (
                <MobileWalletScreen
                  user={userData}
                  refresh={refreshAll}
                  currencySymbol={currencySymbols[userData?.currency] || "KSh"}
                />
              )}
              {currentScreen === "chama" && (
                <MobileChamaScreen
                  user={userData}
                  chamas={chamas}
                  markets={markets}
                  refresh={refreshAll}
                  currencySymbol={currencySymbols[userData?.currency] || "KSh"}
                />
              )}
              {currentScreen === "ussd" && (
                <MobileUssdScreen user={userData} refresh={refreshAll} />
              )}
              {currentScreen === "profile" && (
                <MobileProfileScreen
                  user={userData}
                  userId={userId}
                  setUserId={setUserId}
                  locale={locale}
                  setLocale={setLocale}
                />
              )}
            </>
          )}
        </div>

        {/* Bottom Navigation Bar */}
        <nav className="absolute bottom-0 left-0 right-0 bg-slate-950 border-t border-slate-800 px-2 py-2 flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentScreen(item.id)}
                className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-all ${
                  isActive 
                    ? "text-emerald-400" 
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <div className={`p-1.5 rounded-lg ${isActive ? "bg-emerald-500/10" : ""}`}>
                  {item.icon}
                </div>
                <span className="text-[9px] font-bold">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Home indicator (iOS-style) */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-24 h-1 bg-slate-700 rounded-full"></div>

      </div>
    </div>
  );
}
