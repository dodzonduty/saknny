"use client";

import React from "react";
import { useTranslation } from "@/i18n/useTranslation";

export const LanguageToggle: React.FC = () => {
  const { locale, setLocale } = useTranslation();

  const toggleLanguage = () => {
    setLocale(locale === "en" ? "ar" : "en");
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-1.5 rounded-full px-3 py-1.5 border border-slate-200 text-sm font-medium hover:bg-slate-50 transition-colors text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/20"
      aria-label="Toggle language"
    >
      {locale === "en" ? (
        <>
          <span role="img" aria-label="England Flag" className="text-base leading-none">🏴󠁧󠁢󠁥󠁮󠁧󠁿</span>
          <span>EN</span>
        </>
      ) : (
        <>
          <span role="img" aria-label="Egypt Flag" className="text-base leading-none">🇪🇬</span>
          <span>AR</span>
        </>
      )}
    </button>
  );
};
