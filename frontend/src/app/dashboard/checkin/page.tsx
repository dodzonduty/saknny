"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardNavbar } from "@/components/dashboard/DashboardNavbar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { useTranslation } from "@/i18n/useTranslation";
import { apiClient } from "@/services/api";

export default function CheckinPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [isMounted, setIsMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [checkinResult, setCheckinResult] = useState<{ checkin_id: number; status: string } | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("user_role");
    if (!token) router.push("/auth");
    else if (role === "admin") router.push("/admin");
  }, [router]);

  const handleCheckin = async () => {
    setIsSubmitting(true);
    setApiError(null);

    const res = await apiClient<{ checkin_id: number; status: string }>("/checkins/initiate", {
      method: "POST",
    });

    if (res.success && res.data) {
      setCheckinResult(res.data);
    } else {
      setApiError(res.error || "Failed to initiate check-in.");
    }
    setIsSubmitting(false);
  };

  if (!isMounted) return null;

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      <DashboardNavbar />
      <DashboardSidebar />

      <main className="lg:ms-64 pt-24 pb-12 px-8 flex-grow">
        <div className="max-w-2xl mx-auto space-y-8">

          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-full bg-primary-container text-white flex items-center justify-center shadow-soft">
              <span className="material-symbols-outlined text-2xl">key</span>
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-primary font-headline">Check-in</h1>
              <p className="text-sm text-on-surface-variant">Request your room key to start residency.</p>
            </div>
          </div>

          <div className="bg-white shadow-soft rounded-2xl p-8 border border-transparent">
            {checkinResult ? (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-6xl text-emerald-500 mb-4">task_alt</span>
                <h3 className="text-xl font-bold text-on-surface mb-2 font-headline">Check-in Initiated!</h3>
                <p className="text-on-surface-variant mb-6">Your check-in request has been submitted. An administrator will issue your key shortly.</p>
                <div className="bg-surface-container-lowest rounded-xl p-4 inline-flex gap-8">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-outline-variant">Check-in ID</div>
                    <div className="text-lg font-black text-primary">#{checkinResult.checkin_id}</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-outline-variant">Status</div>
                    <div className="text-lg font-black text-amber-700 capitalize">{checkinResult.status}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-6xl text-primary/30 mb-4">vpn_key</span>
                <h3 className="text-xl font-bold text-on-surface mb-2 font-headline">Ready to Move In?</h3>
                <p className="text-on-surface-variant mb-8 max-w-sm mx-auto">
                  Once you have an approved allocation and a signed lease, you can request your room key here. An administrator will verify and issue the key.
                </p>

                {apiError && (
                  <div className="mb-6 p-4 rounded-lg bg-error-container text-on-error-container text-sm font-semibold flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-lg">error</span>
                    {apiError}
                  </div>
                )}

                <button
                  onClick={handleCheckin}
                  disabled={isSubmitting}
                  className="bg-primary text-white px-8 py-4 rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-70 flex items-center gap-2 mx-auto shadow-soft"
                >
                  {isSubmitting ? (
                    <span className="material-symbols-outlined animate-spin">refresh</span>
                  ) : (
                    <span className="material-symbols-outlined">key</span>
                  )}
                  Request Check-in
                </button>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
