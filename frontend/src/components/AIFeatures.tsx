"use client";

import React from "react";
import { SectionHeading } from "./ui/SectionHeading";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useTranslation } from "@/i18n/useTranslation";

export const AIFeatures: React.FC = () => {
  const { ref, isVisible } = useScrollReveal();
  const { t, locale } = useTranslation();
  
  const cardsData = t("aiFeatures.cards");
  const iconsData = [
    { icon: "group_add", iconBgClass: "bg-primary/10", iconColorClass: "text-primary" },
    { icon: "recommend", iconBgClass: "bg-accent-yellow/20", iconColorClass: "text-accent-yellow-hover" },
    { icon: "bolt", iconBgClass: "bg-primary/10", iconColorClass: "text-primary" }
  ];

  return (
    <section className="w-full bg-gradient-to-br from-primary/5 via-slate-50 to-primary/10 py-24 border-y border-slate-100">
      <div className="px-8 max-w-7xl mx-auto flex flex-col items-center gap-16 text-center">
        <SectionHeading
          title={t("aiFeatures.title")}
          subtitle={t("aiFeatures.subtitle")}
        />

        <div
          ref={ref}
          className={`grid grid-cols-1 md:grid-cols-3 gap-8 w-full items-stretch transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
          }`}
        >
          {cardsData.map((card: any, index: number) => (
            <Card
              key={index}
              icon={iconsData[index].icon}
              iconBgClass={iconsData[index].iconBgClass}
              iconColorClass={iconsData[index].iconColorClass}
              title={card.title}
              description={card.description}
            />
          ))}
        </div>

        <Button variant="primary" icon="auto_awesome" iconPosition={locale === "ar" ? "left" : "right"} className={locale === "ar" ? "rtl:flex-row-reverse mt-4" : "mt-4"}>
          {t("aiFeatures.cta")}
        </Button>
      </div>
    </section>
  );
};
