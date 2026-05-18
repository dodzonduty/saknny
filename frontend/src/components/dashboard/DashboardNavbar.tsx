"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useTranslation } from "@/i18n/useTranslation";
import { apiClient } from "@/services/api";

interface DashboardNavbarProps {
  isAdmin?: boolean;
}

interface NotificationCount {
  unread_messages: number;
  announcements: number;
  total: number;
}

export const DashboardNavbar: React.FC<DashboardNavbarProps> = ({ isAdmin = false }) => {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const [userInitial, setUserInitial] = useState<string>("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifCount, setNotifCount] = useState<NotificationCount>({ unread_messages: 0, announcements: 0, total: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Read cached name from localStorage first for instant render
    const cachedName = localStorage.getItem("user_name");
    if (cachedName) {
      setUserInitial(cachedName.trim().charAt(0).toUpperCase());
    }

    // Fetch fresh name from the API
    const userId = localStorage.getItem("user_id");
    if (userId) {
      apiClient<any>(`/students/${userId}`).then((res) => {
        if (res.success && res.data && res.data.name) {
          const firstLetter = res.data.name.trim().charAt(0).toUpperCase();
          setUserInitial(firstLetter);
          localStorage.setItem("user_name", res.data.name);
        }
      });
    }
  }, []);

  // Fetch notification count on mount and poll every 30 seconds
  const fetchNotificationCount = useCallback(() => {
    apiClient<NotificationCount>("/notifications/count").then((res) => {
      if (res.success && res.data) {
        setNotifCount(res.data);
      }
    });
  }, []);

  useEffect(() => {
    fetchNotificationCount();
    const interval = setInterval(fetchNotificationCount, 30000);
    return () => clearInterval(interval);
  }, [fetchNotificationCount]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_name");
    router.push("/auth");
  };

  // Determine the letter to show in the avatar
  const avatarLetter = isAdmin ? "A" : userInitial || "?";

  // Map sidebar routes to their labels for the active tab display
  const navItems = [
    { href: "/dashboard", label: t("dashboard.sidebarHome") },
    { href: "/dashboard/profile", label: t("dashboard.sidebarProfile") },
    { href: "/dashboard/catalog", label: t("dashboard.sidebarCatalog") },
    { href: "/dashboard/applications", label: t("dashboard.sidebarApplications") },
    { href: "/dashboard/allocation", label: t("dashboard.sidebarAllocation") },
    { href: "/dashboard/lease", label: t("dashboard.sidebarLease") },
    { href: "/dashboard/billing", label: t("dashboard.sidebarBilling") },
    { href: "/dashboard/maintenance", label: t("dashboard.sidebarMaintenance") },
    { href: "/dashboard/messages", label: t("dashboard.sidebarMessages") },
    { href: "/dashboard/announcements", label: t("dashboard.sidebarAnnouncements") },
  ];

  // Find the active page label based on current pathname
  const activeItem = navItems.find(
    (item) => item.href !== "/dashboard"
      ? pathname?.startsWith(item.href)
      : pathname === item.href
  ) || navItems[0];

  const hasUnread = notifCount.total > 0;

  return (
    <header className="fixed top-0 w-full z-50 glass-nav flex justify-between items-center px-8 h-20 max-w-full mx-auto border-none shadow-sm">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <Image src="/images/logo.png" alt="University Logo" width={48} height={48} className="object-contain" />
          <span className="text-2xl font-black tracking-tighter text-primary font-headline">Sakny</span>
        </div>
        {!isAdmin && (
          <nav className="hidden md:flex gap-6">
            <Link href={activeItem.href} className="text-primary font-bold border-b-2 border-primary pb-1">
              {activeItem.label}
            </Link>
          </nav>
        )}
      </div>
      <div className="flex items-center gap-4">
        {/* Notification bell with unread indicator */}
        <Link
          href={isAdmin ? "/admin/messages" : "/dashboard/messages"}
          className="relative p-2 text-on-surface-variant hover:opacity-80 transition-opacity duration-200 active:scale-95"
          title={hasUnread ? `${notifCount.total} unread notification${notifCount.total > 1 ? "s" : ""}` : "Notifications"}
        >
          <span className="material-symbols-outlined">notifications</span>
          {hasUnread && (
            <>
              {/* Pulsing green ring (animated) */}
              <span className="absolute top-1.5 right-1.5 w-3 h-3 rounded-full bg-emerald-400 opacity-75 animate-ping" />
              {/* Solid green dot */}
              <span className="absolute top-1.5 right-1.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
              {/* Count badge */}
              {notifCount.total > 0 && (
                <span className="absolute -top-0.5 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-emerald-500 text-white text-[10px] font-bold px-1 shadow-md">
                  {notifCount.total > 99 ? "99+" : notifCount.total}
                </span>
              )}
            </>
          )}
        </Link>

        <button className="p-2 text-on-surface-variant hover:opacity-80 transition-opacity duration-200 active:scale-95">
          <span className="material-symbols-outlined">settings</span>
        </button>

        {/* Profile avatar with dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown((prev) => !prev)}
            className="w-10 h-10 rounded-full border-2 border-primary-container bg-primary flex items-center justify-center text-white font-bold text-sm relative cursor-pointer hover:opacity-90 transition-opacity"
          >
            {avatarLetter}
            {isAdmin && (
              <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white text-[9px] font-bold px-1 rounded">
                ADMIN
              </span>
            )}
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-outline-variant/20 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <Link
                href={isAdmin ? "/admin" : "/dashboard/profile"}
                onClick={() => setShowDropdown(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-lg">person</span>
                My Profile
              </Link>
              <div className="border-t border-outline-variant/20 my-1" />
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
              >
                <span className="material-symbols-outlined text-lg">logout</span>
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
