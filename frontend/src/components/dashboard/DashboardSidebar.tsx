"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/i18n/useTranslation";

export const DashboardSidebar: React.FC = () => {
  const { t } = useTranslation();

  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", icon: "dashboard", label: t("dashboard.sidebarHome") },
    { href: "/dashboard/profile", icon: "person", label: t("dashboard.sidebarProfile") },
    { href: "/dashboard/catalog", icon: "apartment", label: t("dashboard.sidebarCatalog") },
    { href: "/dashboard/applications", icon: "assignment", label: t("dashboard.sidebarApplications") },
    { href: "/dashboard/allocation", icon: "bed", label: t("dashboard.sidebarAllocation") },
    { href: "/dashboard/lease", icon: "description", label: t("dashboard.sidebarLease") },
    { href: "/dashboard/billing", icon: "payments", label: t("dashboard.sidebarBilling") },
    { href: "/dashboard/maintenance", icon: "build", label: t("dashboard.sidebarMaintenance") },
    { href: "/dashboard/messages", icon: "chat", label: t("dashboard.sidebarMessages") },
    { href: "/dashboard/announcements", icon: "campaign", label: t("dashboard.sidebarAnnouncements") },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen hidden lg:flex flex-col p-6 w-64 bg-surface-container-low z-40 pt-24 border-none shadow-sm">
      <nav className="flex flex-col gap-2 flex-grow mt-6 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link 
              key={item.href}
              href={item.href} 
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                isActive 
                  ? "text-primary bg-primary-fixed/30 font-semibold" 
                  : "text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              <span className="material-symbols-outlined" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
                {item.icon}
              </span>
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      
      <Link href="/dashboard/applications" className="mt-auto bg-primary text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
        <span className="material-symbols-outlined text-sm">add</span>
        <span className="text-xs font-bold uppercase tracking-wider">New Application</span>
      </Link>
    </aside>
  );
};
