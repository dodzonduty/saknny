"use client";

import React from "react";
import { useTranslation } from "@/i18n/useTranslation";

export const TrustBanner: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="bg-primary/5 text-primary py-2 text-center text-sm font-semibold flex items-center justify-center gap-2 border-b border-primary/10 mt-[73px]">
      <span className="material-symbols-outlined text-[18px]">verified_user</span>
      {t("trustBanner.text")}
    </div>
  );
};
