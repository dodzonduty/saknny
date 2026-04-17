"use client";

import React from "react";
import { Button } from "./ui/Button";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useTranslation } from "@/i18n/useTranslation";

export const FinalCTA: React.FC = () => {
  const { ref, isVisible } = useScrollReveal();
  const { t, locale } = useTranslation();

  return (
    <section className="px-8 max-w-7xl mx-auto w-full">
      <div
        ref={ref}
        className={`bg-primary rounded-[2rem] p-16 md:p-24 text-center flex flex-col items-center gap-10 shadow-soft-lg relative overflow-hidden transition-all duration-1000 ${
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent-yellow opacity-10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>

        <div className="relative z-10 flex flex-col items-center gap-8">
          <h2 className="font-headline text-4xl md:text-5xl font-extrabold text-white tracking-tight max-w-3xl leading-tight">
            {t("finalCta.titleLine1")} <br />
            {t("finalCta.titleLine2")}
          </h2>
          <p className="font-body text-slate-300 text-xl max-w-2xl font-light">
            {t("finalCta.subtitle")}
          </p>

          <Button variant="primary" icon="login" iconPosition={locale === "ar" ? "right" : "left"} className={locale === "ar" ? "rtl:flex-row-reverse mt-4 shadow-accent-yellow/20" : "mt-4 shadow-accent-yellow/20"}>
            {t("finalCta.cta")}
          </Button>
        </div>
      </div>
    </section>
  );
};
