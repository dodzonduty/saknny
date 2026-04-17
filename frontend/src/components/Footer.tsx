"use client";

import React from "react";
import Image from "next/image";
import { useTranslation } from "@/i18n/useTranslation";

export const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="font-body text-sm font-normal w-full border-t border-slate-200 bg-white text-slate-600 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row w-full justify-between items-center gap-8 px-8 py-12">
        <div className="flex items-center gap-3 text-2xl font-black text-primary">
          <Image src="/images/logo.png" alt="University Logo" width={64} height={64} className="object-contain" />
          <span>{t("nav.brand")}</span>
        </div>
        
        <div className="flex flex-wrap justify-center md:justify-end gap-8 text-slate-500 font-medium">
          <a className="hover:text-primary transition-colors duration-200" href="#">
            {t("footer.privacy")}
          </a>
          <a className="hover:text-primary transition-colors duration-200" href="#">
            {t("footer.terms")}
          </a>
          <a className="hover:text-primary transition-colors duration-200" href="#">
            {t("footer.accessibility")}
          </a>
          <a className="hover:text-primary transition-colors duration-200" href="#">
            {t("footer.contact")}
          </a>
          <a className="hover:text-primary transition-colors duration-200" href="#">
            {t("footer.partners")}
          </a>
        </div>
        
        <div className="text-slate-400 text-xs text-center md:text-left">
          © {new Date().getFullYear()} {t("footer.copyright")}
        </div>
      </div>
    </footer>
  );
};
