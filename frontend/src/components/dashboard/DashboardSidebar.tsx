"use client";

import React from "react";
import Link from "next/link";
import { useTranslation } from "@/i18n/useTranslation";

export const DashboardSidebar: React.FC = () => {
  const { t } = useTranslation();

  return (
    <aside className="fixed left-0 top-0 h-screen hidden lg:flex flex-col p-6 w-64 bg-surface-container-low z-40 pt-24 border-none shadow-sm">
      <nav className="flex flex-col gap-2 flex-grow mt-6">
        <Link href="/dashboard" className="flex items-center gap-3 p-3 text-primary bg-primary-fixed/30 font-semibold rounded-lg transition-colors">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
          <span className="text-sm">{t("dashboard.sidebarHome")}</span>
        </Link>
        <a href="#" className="flex items-center gap-3 p-3 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors">
          <span className="material-symbols-outlined">description</span>
          <span className="text-sm">{t("dashboard.sidebarPlaceholder1")}</span>
        </a>
        <a href="#" className="flex items-center gap-3 p-3 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors">
          <span className="material-symbols-outlined">payments</span>
          <span className="text-sm">{t("dashboard.sidebarPlaceholder2")}</span>
        </a>
        <a href="#" className="flex items-center gap-3 p-3 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors">
          <span className="material-symbols-outlined">build</span>
          <span className="text-sm">{t("dashboard.sidebarPlaceholder3")}</span>
        </a>
        <a href="#" className="flex items-center gap-3 p-3 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors">
          <span className="material-symbols-outlined">person</span>
          <span className="text-sm">{t("dashboard.sidebarPlaceholder4")}</span>
        </a>
      </nav>
      
      <button className="mt-auto bg-primary text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
        <span className="material-symbols-outlined text-sm">add</span>
        <span className="text-xs font-bold uppercase tracking-wider">New Application</span>
      </button>
    </aside>
  );
};
