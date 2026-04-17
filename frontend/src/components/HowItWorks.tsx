"use client";

import React from "react";
import { SectionHeading } from "./ui/SectionHeading";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useTranslation } from "@/i18n/useTranslation";

export const HowItWorks: React.FC = () => {
  const { ref, isVisible } = useScrollReveal();
  const { t } = useTranslation();
  const stepsData = t("howItWorks.steps");

  return (
    <section
      id="how-it-works"
      className="px-8 max-w-7xl mx-auto w-full flex flex-col gap-16 bg-surface rounded-2xl p-16 shadow-soft border border-slate-100"
    >
      <SectionHeading
        title={t("howItWorks.title")}
        subtitle={t("howItWorks.subtitle")}
      />

      <div
        ref={ref}
        className={`grid grid-cols-1 md:grid-cols-4 gap-12 relative mt-8 transition-all duration-700 delay-100 transform ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
        }`}
      >
        <div className="hidden md:block absolute top-10 left-[12%] right-[12%] h-0.5 bg-slate-200 z-0"></div>

        {stepsData.map((step: any, index: number) => (
          <div key={index} className="flex flex-col items-center text-center gap-6 relative z-10">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center font-headline font-bold text-2xl ${
              index === 0 
                ? "bg-primary text-white shadow-lg" 
                : "bg-white text-primary border-2 border-slate-200 shadow-sm"
            }`}>
              {index + 1}
            </div>
            <div className="flex flex-col gap-2">
              <h4 className="font-headline font-bold text-xl text-primary">
                {step.title}
              </h4>
              <p className="font-body text-base text-on-surface-variant">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
