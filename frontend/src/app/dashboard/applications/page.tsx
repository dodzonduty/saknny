"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardNavbar } from "@/components/dashboard/DashboardNavbar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { useTranslation } from "@/i18n/useTranslation";
import { apiClient } from "@/services/api";
import Link from "next/link";

interface Application {
  app_id: number;
  preferred_dorm_id: number | null;
  status: string;
  waitlist_position: number | null;
  submission_date: string;
  next_actions: string;
}

export default function ApplicationsPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("user_role");
    
    if (!token) {
      router.push("/auth");
    } else if (role === "admin") {
      router.push("/admin");
    } else {
      fetchApplications();
    }
  }, [router]);

  const fetchApplications = async () => {
    setLoading(true);
    const res = await apiClient<{ items: Application[] }>("/applications/me");
    if (res.success && res.data) {
      setApplications(res.data.items);
    }
    setLoading(false);
  };

  const handleJoinWaitlist = async (appId: number) => {
    setActionLoadingId(appId);
    const res = await apiClient<any>(`/applications/${appId}/waitlist`, {
      method: "POST"
    });
    if (res.success) {
      // Refresh applications to see the new status and waitlist position
      fetchApplications();
    } else {
      alert(res.error || "Failed to join waitlist");
      setActionLoadingId(null);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      <DashboardNavbar />
      <DashboardSidebar />
      
      <main className="lg:ms-64 pt-24 pb-12 px-8 flex-grow">
        <div className="max-w-4xl mx-auto space-y-8">
          
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-full bg-primary-container text-white flex items-center justify-center shadow-soft">
              <span className="material-symbols-outlined text-2xl">assignment</span>
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-primary font-headline">
                {t("applications.title")}
              </h1>
              <p className="text-sm text-on-surface-variant">
                {t("applications.subtitle")}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center">
              <span className="material-symbols-outlined text-primary text-4xl animate-spin">refresh</span>
            </div>
          ) : applications.length === 0 ? (
            <div className="bg-white shadow-soft rounded-2xl p-12 border border-transparent text-center">
              <div className="w-20 h-20 bg-surface-container-low rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-4xl text-outline-variant">assignment_late</span>
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-2 font-headline">{t("applications.emptyState")}</h3>
              <p className="text-on-surface-variant mb-8 max-w-md mx-auto">
                {t("applications.emptyStateDesc")}
              </p>
              <Link 
                href="/dashboard/apply" 
                className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity shadow-soft"
              >
                <span className="material-symbols-outlined">post_add</span>
                {t("applications.applyNow")}
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {applications.map(app => (
                <div key={app.app_id} className="bg-white shadow-soft rounded-2xl p-6 border border-transparent hover:border-outline-variant/30 transition-colors flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                  
                  <div className="flex-grow space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-black text-on-surface font-headline">{t("applications.applicationNumber")}{app.app_id}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded flex items-center gap-1 ${
                        app.status === 'approved' ? 'bg-emerald-50 text-emerald-800' : 
                        app.status === 'rejected' ? 'bg-error-container text-on-error-container' : 
                        app.status === 'waitlisted' ? 'bg-orange-50 text-orange-800' :
                        app.status === 'under_review' ? 'bg-amber-50 text-amber-800' :
                        'bg-blue-50 text-blue-800'
                      }`}>
                        {app.status === 'waitlisted' && <span className="material-symbols-outlined text-[12px]">schedule</span>}
                        {app.status.replace("_", " ")}
                      </span>
                    </div>
                    
                    <div className="text-sm text-on-surface-variant flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                      {t("applications.submitted")} {new Date(app.submission_date).toLocaleDateString()}
                    </div>
                    
                    {app.preferred_dorm_id && (
                      <div className="text-sm font-semibold text-primary flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px]">apartment</span>
                        {t("applications.preferredDormId")} {app.preferred_dorm_id}
                      </div>
                    )}

                    {app.waitlist_position !== null && (
                      <div className="text-sm font-bold text-orange-700 bg-orange-50 inline-block px-3 py-1 rounded-lg mt-2">
                        {t("applications.waitlistPosition")} #{app.waitlist_position}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-start md:items-end gap-3 min-w-[200px]">
                    <div className="text-xs font-bold uppercase tracking-widest text-outline-variant">
                      {t("applications.nextAction")}
                    </div>
                    <div className="text-sm font-medium text-on-surface bg-surface-container-lowest px-4 py-2 rounded-lg border border-outline-variant/30 w-full md:w-auto text-center">
                      {app.next_actions.replace(/_/g, " ")}
                    </div>
                    
                    {app.status === "waitlisted" && app.waitlist_position === null && (
                      <button
                        onClick={() => handleJoinWaitlist(app.app_id)}
                        disabled={actionLoadingId === app.app_id}
                        className="w-full md:w-auto bg-orange-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-orange-600 transition-colors mt-2 flex items-center justify-center gap-2"
                      >
                        {actionLoadingId === app.app_id ? (
                          <span className="material-symbols-outlined animate-spin text-[18px]">refresh</span>
                        ) : (
                          <span className="material-symbols-outlined text-[18px]">group_add</span>
                        )}
                        {t("applications.waitlistButton")}
                      </button>
                    )}
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
