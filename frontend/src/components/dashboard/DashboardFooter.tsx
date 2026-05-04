import React from "react";
import Image from "next/image";
import { useTranslation } from "@/i18n/useTranslation";

export const DashboardFooter: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="lg:ml-64 bg-white w-full lg:w-[calc(100%-16rem)] py-12 px-8 border-none flex flex-col md:flex-row justify-between items-center gap-4 shadow-[0_-4px_20px_-2px_rgba(0,0,0,0.05)] relative z-10">
      <div className="flex flex-col items-center md:items-start gap-4">
        <div className="flex items-center gap-3">
          <Image src="/images/logo.png" alt="University Logo" width={40} height={40} className="object-contain" />
          <span className="font-bold uppercase text-primary font-headline">{t("dashboard.footerBrand")}</span>
        </div>
        <p className="text-on-surface-variant text-xs tracking-wide">{t("dashboard.footerCopyright")}</p>
      </div>
      <div className="flex gap-8">
        <a href="#" className="text-on-surface-variant text-xs tracking-wide hover:text-primary transition-colors">Terms of Service</a>
        <a href="#" className="text-on-surface-variant text-xs tracking-wide hover:text-primary transition-colors">Privacy Policy</a>
        <a href="#" className="text-on-surface-variant text-xs tracking-wide hover:text-primary transition-colors">Contact Support</a>
        <a href="#" className="text-on-surface-variant text-xs tracking-wide hover:text-primary transition-colors">Housing Handbook</a>
      </div>
    </footer>
  );
};
