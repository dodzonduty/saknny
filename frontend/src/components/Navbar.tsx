"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "./ui/Button";
import { useTranslation } from "@/i18n/useTranslation";
import { LanguageToggle } from "./LanguageToggle";

export const Navbar: React.FC = () => {
  const [active, setActive] = useState("discover");
  const [isScrolled, setIsScrolled] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // check on mount
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setActive(id);
    const element = document.getElementById(id);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 80,
        behavior: "smooth",
      });
    }
  };

  return (
    <header
      className={`font-headline font-bold text-sm tracking-tight fixed top-0 w-full flex justify-between items-center px-8 py-4 z-50 transition-all duration-300 ${
        isScrolled
          ? "glass-nav border-b border-slate-200 shadow-md"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto flex w-full justify-between items-center">
        <div className="flex items-center gap-3 text-2xl font-black tracking-tighter text-primary">
          <Image src="/images/logo.png" alt="University Logo" width={64} height={64} className="object-contain" />
          <span>{t("nav.brand")}</span>
        </div>
        <nav className="hidden md:flex gap-8">
          <a
            className={`${
              active === "discover"
                ? "text-primary border-b-2 border-accent-yellow pb-1"
                : "text-slate-500 hover:text-primary"
            } transition-all duration-300`}
            href="#discover"
            onClick={(e) => handleNavClick(e, "discover")}
          >
            {t("nav.discover")}
          </a>
          <a
            className={`${
              active === "how-it-works"
                ? "text-primary border-b-2 border-accent-yellow pb-1"
                : "text-slate-500 hover:text-primary"
            } transition-colors duration-300`}
            href="#how-it-works"
            onClick={(e) => handleNavClick(e, "how-it-works")}
          >
            {t("nav.howItWorks")}
          </a>
          <a
            className={`${
              active === "features"
                ? "text-primary border-b-2 border-accent-yellow pb-1"
                : "text-slate-500 hover:text-primary"
            } transition-colors duration-300`}
            href="#features"
            onClick={(e) => handleNavClick(e, "features")}
          >
            {t("nav.features")}
          </a>
        </nav>
        <div className="flex items-center gap-4">
          <LanguageToggle />
          <Link href="/auth">
            <Button variant="navy">{t("nav.studentLogin")}</Button>
          </Link>
        </div>
      </div>
    </header>
  );
};
