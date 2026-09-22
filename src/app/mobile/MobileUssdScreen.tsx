"use client";

import React, { useState } from "react";
import { MessageSquare, Phone, Send, RotateCw, Wifi, WifiOff, Battery, Signal } from "lucide-react";

interface Props {
  user: any;
  refresh: () => void;
}

export default function MobileUssdScreen({ user, refresh }: Props) {
  const [sessionState, setSessionState] = useState<string>("");
  const [display, setDisplay] = useState<string>(
    "CON Karibu Arena Predictions!\nSelect option:\n1. Live Markets\n2. Deposit Funds\n3. Check Balance\n4. View Chamas\n5. My Predictions"
  );
  const [inputVal, setInputVal] = useState<string>("");
  const [shouldClose, setShouldClose] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [history, setHistory] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    const input = inputVal.trim();
    if (!input) return;

    setHistory((prev) => [...prev, `> ${input}`]);
    setLoading(true);

    try {
      const fullText = sessionState ? `${sessionState}*${input}` : input;
      const res = await fetch("/api/ussd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: user?.phoneNumber,
          text: fullText,
          userId: user?.id,
          sessionId: `sess_${Date.now()}`,
        }),
      });
      const json = await res.json();
      
      if (json.response) {
        setDisplay(json.response);
        const isEnd = json.response.startsWith("END ");
        setShouldClose(isEnd);
        if (!isEnd) {
          setSessionState(fullText);
        } else {
          setSessionState("");
          refresh();
        }
      }
    } catch (e: any) {
      setDisplay(`END Error: ${e.message}`);
      setShouldClose(true);
    }

    setInputVal("");
    setLoading(false);
  };

  const reset = () => {
    setSessionState("");
    setDisplay(
      "CON Karibu Arena Predictions!\nSelect option:\n1. Live Markets\n2. Deposit Funds\n3. Check Balance\n4. View Chamas\n5. My Predictions"
    );
    setShouldClose(false);
    setInputVal("");
    setHistory([]);
  };

  const quickKeys = ["1", "2", "3", "4", "5", "0", "*", "#"];

  return (
    <div className="flex flex-col h-full">
      
      {/* Header */}
      <div className="bg-slate-900 p-4 border-b border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-amber-400" />
            USSD Gateway
          </h2>
          <button
            onClick={reset}
            className="bg-slate-800 text-slate-400 hover:text-white p-1.5 rounded-lg text-xs"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-[10px] text-slate-400">
          Dial <code className="bg-slate-800 text-amber-400 px-1.5 py-0.5 rounded font-mono font-bold">*384#</code> to access Arena Predictions offline
        </p>
      </div>

      {/* USSD Terminal Display */}
      <div className="flex-1 bg-slate-950 p-3 mx-3 mt-3 rounded-2xl border border-slate-800 flex flex-col min-h-[280px]">
        
        {/* Status Bar inside terminal */}
        <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono border-b border-slate-800 pb-1.5 mb-2">
          <span className="flex items-center gap-1">
            <Signal className="w-2.5 h-2.5 text-emerald-500" />
            <span className="font-bold">SAFARICOM</span>
          </span>
          <span className="text-amber-500 font-bold">Dialed: *384#</span>
          <span className="flex items-center gap-1">
            <Battery className="w-2.5 h-2.5" />
            <span>98%</span>
          </span>
        </div>

        {/* Display content */}
        <div className="flex-1 overflow-y-auto">
          {history.length > 0 && (
            <div className="text-[10px] text-slate-600 font-mono mb-2 space-y-0.5">
              {history.slice(-5).map((h, i) => (
                <div key={i}>{h}</div>
              ))}
              <div className="border-b border-slate-800 my-1"></div>
            </div>
          )}
          
          <pre className="font-mono text-amber-400 whitespace-pre-wrap leading-relaxed text-xs">
            {display}
          </pre>
        </div>

        {/* Session info */}
        {!shouldClose && sessionState && (
          <div className="mt-2 pt-2 border-t border-slate-800">
            <span className="text-[9px] text-slate-500 font-mono">
              Session: {sessionState.split("*").length} steps
            </span>
          </div>
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-3 bg-slate-900">
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder={shouldClose ? "Session ended. Reset to retry." : "Type number and press Send"}
            disabled={shouldClose || loading}
            className="flex-1 bg-slate-950 text-white text-xs border border-slate-800 rounded-xl p-2.5 font-mono focus:outline-none focus:border-amber-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={shouldClose || loading || !inputVal.trim()}
            className="bg-amber-400 text-slate-950 font-extrabold px-4 rounded-xl hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            {loading ? (
              <RotateCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {shouldClose && (
          <button
            type="button"
            onClick={reset}
            className="w-full bg-slate-800 text-slate-300 hover:text-white text-xs font-bold py-2 rounded-xl"
          >
            Reset & Redial *384#
          </button>
        )}
      </form>

      {/* Quick Numeric Keypad */}
      <div className="px-3 pb-3 bg-slate-900">
        <div className="grid grid-cols-4 gap-1.5">
          {quickKeys.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                if (shouldClose) return;
                setInputVal(key);
                setTimeout(() => {
                  const form = document.querySelector("form");
                  form?.requestSubmit();
                }, 100);
              }}
              disabled={shouldClose}
              className="bg-slate-800 hover:bg-slate-750 disabled:opacity-30 text-white font-bold py-3 rounded-xl text-sm transition-all"
            >
              {key}
            </button>
          ))}
        </div>
        <p className="text-center text-[10px] text-slate-500 mt-2">
          Tap a key to send instantly, or type and press Send
        </p>
      </div>
    </div>
  );
}
