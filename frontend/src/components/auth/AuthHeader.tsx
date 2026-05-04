"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "@/i18n/useTranslation";

interface AuthHeaderProps {
  activeTab: "login" | "register";
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({ activeTab }) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center text-center gap-4">
      <Link href="/" className="inline-block transition-transform hover:scale-105">
        <Image src="/images/logo.png" alt="Sakny Logo" width={64} height={64} className="object-contain" />
      </Link>
      
      <div className="flex flex-col gap-2">
        <h1 className="font-headline text-3xl font-bold text-primary">
          {activeTab === "login" ? t("auth.loginTitle") : t("auth.registerTitle")}
        </h1>
        <p className="font-body text-base text-on-surface-variant">
          {activeTab === "login" ? t("auth.loginSubtitle") : t("auth.registerSubtitle")}
        </p>
      </div>
    </div>
  );
};
