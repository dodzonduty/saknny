"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardNavbar } from "@/components/dashboard/DashboardNavbar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { useTranslation } from "@/i18n/useTranslation";
import { apiClient } from "@/services/api";

interface Announcement {
  announcement_id: number;
  title: string;
  content: string;
  target_role: string;
  published_at: string;
}

export default function AnnouncementsPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    setIsMounted(true);
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("user_role");
    if (!token) router.push("/auth");
    else if (role === "admin") router.push("/admin");
    else fetchAnnouncements();
  }, [router]);

  const fetchAnnouncements = async () => {
    setLoading(true);
    const res = await apiClient<{ items: Announcement[] }>("/announcements");
    if (res.success && res.data) setAnnouncements(res.data.items);
    setLoading(false);
  };

  if (!isMounted) return null;

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      <DashboardNavbar />
      <DashboardSidebar />

      <main className="lg:ml-64 pt-24 pb-12 px-8 flex-grow">
        <div className="max-w-3xl mx-auto space-y-8">

          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-full bg-primary-container text-primary flex items-center justify-center shadow-soft">
              <span className="material-symbols-outlined text-2xl">campaign</span>
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-primary font-headline">Announcements</h1>
              <p className="text-sm text-on-surface-variant">Important updates from administration.</p>
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center"><span className="material-symbols-outlined text-primary text-4xl animate-spin">refresh</span></div>
          ) : announcements.length === 0 ? (
            <div className="bg-white shadow-soft rounded-2xl p-12 text-center border border-transparent">
              <div className="w-20 h-20 bg-surface-container-low rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-4xl text-outline-variant">notifications_none</span>
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-2 font-headline">No Announcements</h3>
              <p className="text-on-surface-variant">There are no active announcements at this time.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((ann) => (
                <div key={ann.announcement_id} className="bg-white shadow-soft rounded-2xl p-6 border-l-4 border-primary hover:shadow-soft-lg transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-on-surface font-headline">{ann.title}</h3>
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-primary/10 text-primary">
                      {ann.target_role}
                    </span>
                  </div>
                  <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                  <div className="mt-4 text-xs text-outline-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                    {new Date(ann.published_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
