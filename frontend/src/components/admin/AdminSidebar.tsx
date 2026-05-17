"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/i18n/useTranslation";

export const AdminSidebar: React.FC = () => {
  const { t } = useTranslation();
  const pathname = usePathname();

  const navItems = [
    { href: "/admin", icon: "dashboard", label: t("dashboard.adminSidebarOverview") },
    { href: "/admin/verifications", icon: "verified_user", label: t("dashboard.adminSidebarVerifications") },
    { href: "/admin/students", icon: "school", label: t("dashboard.adminSidebarStudents") },
    { href: "/admin/applications", icon: "assignment", label: t("dashboard.adminSidebarApplications") },
    { href: "/admin/catalog", icon: "apartment", label: t("dashboard.adminSidebarCatalog") },
    { href: "/admin/allocations", icon: "bed", label: t("dashboard.adminSidebarAllocations") },
    { href: "/admin/leases", icon: "description", label: t("dashboard.adminSidebarLeases") },
    { href: "/admin/billing", icon: "payments", label: t("dashboard.adminSidebarBilling") },
    { href: "/admin/checkins", icon: "key", label: t("dashboard.adminSidebarCheckins") },
    { href: "/admin/maintenance", icon: "build", label: t("dashboard.adminSidebarMaintenance") },
    { href: "/admin/room-changes", icon: "swap_horiz", label: t("dashboard.adminSidebarRoomChanges") },
    { href: "/admin/announcements", icon: "campaign", label: t("dashboard.adminSidebarAnnouncements") },
    { href: "/admin/audit", icon: "history", label: t("dashboard.adminSidebarAudit") },
    { href: "/admin/surveys", icon: "poll", label: t("dashboard.adminSidebarSurveys") },
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
    </aside>
  );
};
