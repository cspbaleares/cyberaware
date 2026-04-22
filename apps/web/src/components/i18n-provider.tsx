"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import es from "@/i18n/messages/es.json";
import en from "@/i18n/messages/en.json";

export type Locale = "es" | "en";

const messages = { es, en };

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

function getNestedValue(obj: any, path: string): string | undefined {
  return path.split(".").reduce((acc, part) => acc?.[part], obj);
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("locale") as Locale;
      if (saved && messages[saved]) return saved;
      
      const browser = navigator.language.split("-")[0] as Locale;
      if (messages[browser]) return browser;
    }
    return "es";
  });

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== "undefined") {
      localStorage.setItem("locale", newLocale);
      document.documentElement.lang = newLocale;
    }
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string>): string => {
      const message = getNestedValue(messages[locale], key);
      
      if (!message || typeof message !== "string") {
        console.warn(`Translation missing: ${key}`);
        return key;
      }

      // Replace params
      return message.replace(/\{(\w+)\}/g, (match, param) => {
        return params?.[param] ?? match;
      });
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}
