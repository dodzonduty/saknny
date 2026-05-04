"use client";

import React from "react";
import Link from "next/link";
import { Button } from "./ui/Button";
import { useTranslation } from "@/i18n/useTranslation";

export const Hero: React.FC = () => {
  const { t, locale } = useTranslation();

  return (
    <section
      id="discover"
      className="relative w-full flex flex-col items-center text-center bg-[url('/images/hero-students.png')] bg-cover bg-center min-h-[80vh] justify-center"
    >
      <div className="absolute inset-0 bg-primary/80 mix-blend-multiply"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-primary/90 via-primary/70 to-background/90"></div>
      
      <div className="relative z-10 px-8 py-24 max-w-7xl mx-auto flex flex-col items-center gap-10">
        <h1 className="font-headline text-5xl md:text-7xl font-extrabold text-white tracking-tight max-w-5xl leading-tight">
          {t("hero.titleLine1")} <br />
          <span className="text-accent-yellow">{t("hero.titleLine2")}</span>
        </h1>
        <p className="font-body text-xl md:text-2xl text-slate-200 max-w-3xl leading-relaxed font-light">
          {t("hero.subtitle")}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 mt-8 w-full sm:w-auto">
          <Button variant="primary" icon="arrow_forward" iconPosition={locale === "ar" ? "left" : "right"} className={locale === "ar" ? "rtl:flex-row-reverse" : ""}>
            {t("hero.ctaPrimary")}
          </Button>
          <Link href="/auth">
            <Button variant="secondary" icon="school" iconPosition={locale === "ar" ? "right" : "left"}>
              {t("hero.ctaSecondary")}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
