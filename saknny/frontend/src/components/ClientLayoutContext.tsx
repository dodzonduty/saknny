"use client";

import React, { useEffect, ReactNode } from "react";
import { useTranslation } from "@/i18n/useTranslation";

export const ClientLayoutContext = ({ children }: { children: ReactNode }) => {
  const { locale } = useTranslation();

  useEffect(() => {
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = locale;
  }, [locale]);

  return <>{children}</>;
};
