"use client";

import React from "react";
import { Card } from "./ui/Card";
import { SectionHeading } from "./ui/SectionHeading";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useTranslation } from "@/i18n/useTranslation";

export const FeaturesGrid: React.FC = () => {
  const { ref, isVisible } = useScrollReveal();
  const { t } = useTranslation();

  const cardsData = t("featuresGrid.cards");
  const iconsData = [
    { icon: "search", iconBgClass: "bg-primary/5", iconColorClass: "text-primary" },
    { icon: "verified", iconBgClass: "bg-accent-yellow/20", iconColorClass: "text-accent-yellow-hover" },
    { icon: "check_circle", iconBgClass: "bg-emerald-50", iconColorClass: "text-emerald-600" },
    { icon: "timeline", iconBgClass: "bg-primary/5", iconColorClass: "text-primary" }
  ];

  return (
    <section
      id="features"
      className="px-8 max-w-7xl mx-auto w-full flex flex-col gap-16 -mt-16 relative z-20"
    >
      <SectionHeading
        title={t("featuresGrid.title")}
        subtitle={t("featuresGrid.subtitle")}
      />

      <div
        ref={ref}
        className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-stretch transition-all duration-700 transform ${
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
            linkText={card.link}
            linkHref="#"
          />
        ))}
      </div>
    </section>
  );
};
