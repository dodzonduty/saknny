"use client";

import React, { createContext, useState, useEffect, ReactNode } from "react";
import en from "./locales/en.json";
import ar from "./locales/ar.json";

type Locale = "en" | "ar";

interface LanguageContextProps {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => any;
}

export const LanguageContext = createContext<LanguageContextProps>({
  locale: "en",
  setLocale: () => {},
  t: () => "",
});

const translations = {
  en,
  ar,
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>("en");

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("locale", newLocale);
    if (typeof document !== "undefined") {
      document.documentElement.dir = newLocale === "ar" ? "rtl" : "ltr";
      document.documentElement.lang = newLocale;
    }
  };

  // Load from local storage on mount (optional)
  useEffect(() => {
    const savedLocale = (localStorage.getItem("locale") as Locale) || "en";
    setLocale(savedLocale);
  }, []);

  const t = (key: string) => {
    const keys = key.split(".");
    let value: any = translations[locale];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to English if key missing in Arabic
        let fallbackValue: any = translations["en"];
        for (const fk of keys) {
           if (fallbackValue && typeof fallbackValue === 'object' && fk in fallbackValue) {
             fallbackValue = fallbackValue[fk];
           } else {
             return key;
           }
        }
        return fallbackValue;
      }
    }
    return value;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
