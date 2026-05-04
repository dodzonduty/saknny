"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/i18n/useTranslation";

export const DashboardNavbar: React.FC = () => {
  const { t } = useTranslation();

  return (
    <header className="fixed top-0 w-full z-50 glass-nav flex justify-between items-center px-8 h-20 max-w-full mx-auto border-none shadow-sm">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <Image src="/images/logo.png" alt="University Logo" width={48} height={48} className="object-contain" />
          <span className="text-2xl font-black tracking-tighter text-primary font-headline">Sakny</span>
        </div>
        <nav className="hidden md:flex gap-6">
          <Link href="/dashboard" className="text-primary font-bold border-b-2 border-primary pb-1">
            {t("dashboard.navDashboard")}
          </Link>
          <a href="#" className="text-on-surface-variant hover:text-primary transition-colors duration-200">
            {t("dashboard.navFindHousing")}
          </a>
          <a href="#" className="text-on-surface-variant hover:text-primary transition-colors duration-200">
            {t("dashboard.navRoommates")}
          </a>
          <a href="#" className="text-on-surface-variant hover:text-primary transition-colors duration-200">
            {t("dashboard.navSupport")}
          </a>
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <button className="p-2 text-on-surface-variant hover:opacity-80 transition-opacity duration-200 active:scale-95">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <button className="p-2 text-on-surface-variant hover:opacity-80 transition-opacity duration-200 active:scale-95">
          <span className="material-symbols-outlined">settings</span>
        </button>
        <div className="w-10 h-10 rounded-full border-2 border-primary-container bg-primary flex items-center justify-center text-white font-bold text-sm">
          S
        </div>
      </div>
    </header>
  );
};
