"use client";

import React from "react";
import { useTranslation } from "@/i18n/useTranslation";

interface AuthTabsProps {
  activeTab: "login" | "register";
  setActiveTab: (tab: "login" | "register") => void;
}

export const AuthTabs: React.FC<AuthTabsProps> = ({ activeTab, setActiveTab }) => {
  const { t } = useTranslation();

  return (
    <div className="flex w-full border-b border-slate-200">
      <button
        onClick={() => setActiveTab("login")}
        className={`flex-1 py-3 text-center font-headline font-bold text-lg transition-all duration-300 border-b-2 ${
          activeTab === "login"
            ? "border-accent-yellow text-primary"
            : "border-transparent text-slate-400 hover:text-slate-600"
        }`}
      >
        {t("auth.loginTab")}
      </button>
      <button
        onClick={() => setActiveTab("register")}
        className={`flex-1 py-3 text-center font-headline font-bold text-lg transition-all duration-300 border-b-2 ${
          activeTab === "register"
            ? "border-accent-yellow text-primary"
            : "border-transparent text-slate-400 hover:text-slate-600"
        }`}
      >
        {t("auth.registerTab")}
      </button>
    </div>
  );
};
