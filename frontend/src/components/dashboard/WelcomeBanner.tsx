import React from "react";
import { useTranslation } from "@/i18n/useTranslation";

export const WelcomeBanner: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary-container p-10 text-white min-h-[240px] flex flex-col justify-center">
      <div className="relative z-10 space-y-4 max-w-lg">
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none">
          {t("dashboard.welcomeTitle")}
        </h1>
        <p className="text-lg opacity-80 font-body">
          {t("dashboard.welcomeSubtitle")}
        </p>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 h-full w-1/3 bg-white/5 skew-x-[-12deg] translate-x-1/2"></div>
      <div className="absolute bottom-0 right-10 opacity-20">
        <span className="material-symbols-outlined text-[160px]">apartment</span>
      </div>
    </section>
  );
};
