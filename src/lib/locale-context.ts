import { createContext, useContext, useState, useEffect } from "react";
import { type Locale } from "@/lib/i18n";

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return context;
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");

  // Read from localStorage on initial load
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("arena-locale");
      if (stored && ["en", "sw", "fr", "pt"].includes(stored as Locale)) {
        setLocale(stored as Locale);
      }
    } catch (e) {
      console.warn("Failed to read locale from localStorage", e);
    }
  }, []);

  // Write to localStorage when locale changes
  useEffect(() => {
    try {
      window.localStorage.setItem("arena-locale", locale);
    } catch (e) {
      console.warn("Failed to write locale to localStorage", e);
    }
  }, [locale]);

  return (
    React.createElement(LocaleContext.Provider, { value: { locale, setLocale } }, children)
  );
}