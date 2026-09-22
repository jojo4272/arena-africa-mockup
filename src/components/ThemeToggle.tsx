"use client";

import { useLayoutEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

const STORAGE_KEY = "arena-theme";

function applyTheme(theme: "light" | "dark") {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export default function ThemeToggle({ className = "" }: { className?: string }) {
  // Initialize theme from localStorage if available (client-only)
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      return stored === "dark" ? "dark" : "light";
    }
    // Fallback for SSR (should not happen in client component, but safe)
    return "light";
  });

  // Apply theme whenever theme state changes (runs synchronously before paint)
  useLayoutEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Listen for storage events from other tabs/windows to keep theme in sync
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        if (e.newValue === "dark") {
          setTheme("dark");
        } else if (e.newValue === "light") {
          setTheme("light");
        }
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={theme === "dark"}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      onClick={toggle}
      className={
        className ||
        "grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 dark:hover:text-white"
      }
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}