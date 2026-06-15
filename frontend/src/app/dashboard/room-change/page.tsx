"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardNavbar } from "@/components/dashboard/DashboardNavbar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { useTranslation } from "@/i18n/useTranslation";
import { apiClient } from "@/services/api";

interface Building {
  dorm_id: number;
  building_name: string;
}

export default function RoomChangePage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [isMounted, setIsMounted] = useState(false);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [targetBuildingId, setTargetBuildingId] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{ request_id: number; status: string } | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("user_role");
    if (!token) router.push("/auth");
    else if (role === "admin") router.push("/admin");
    else fetchBuildings();
  }, [router]);

  const fetchBuildings = async () => {
    const res = await apiClient<{ items: Building[] }>("/catalog/buildings?status=active");
    if (res.success && res.data) setBuildings(res.data.items);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    setIsSubmitting(true);
    setApiError(null);

    const payload = {
      target_building_id: targetBuildingId ? parseInt(targetBuildingId) : null,
      reason: reason.trim(),
    };

    const res = await apiClient<{ request_id: number; status: string }>("/lifecycle/room-change", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (res.success && res.data) {
      setSuccessResult(res.data);
    } else {
      setApiError(res.error || "Failed to submit room change request.");
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
              <span className="material-symbols-outlined text-2xl">swap_horiz</span>
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-primary font-headline">{t("roomChange.roomChangeTitle")}</h1>
              <p className="text-sm text-on-surface-variant">{t("roomChange.roomChangeDesc")}</p>
            </div>
          </div>

          <div className="bg-white shadow-soft rounded-2xl p-8 border border-transparent">
            {successResult ? (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-6xl text-emerald-500 mb-4">check_circle</span>
                <h3 className="text-xl font-bold text-on-surface mb-2 font-headline">{t("roomChange.requestSubmitted")}</h3>
                <p className="text-on-surface-variant mb-6">{t("roomChange.requestSubmittedDesc")}</p>
                <div className="bg-surface-container-lowest rounded-xl p-4 inline-flex gap-8">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-outline-variant">{t("roomChange.requestId")}</div>
                    <div className="text-lg font-black text-primary">#{successResult.request_id}</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-outline-variant">{t("roomChange.statusLabel")}</div>
                    <div className="text-lg font-black text-amber-700 capitalize">{successResult.status.replace("_", " ")}</div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {apiError && (
                  <div className="mb-6 p-4 rounded-lg bg-error-container text-on-error-container text-sm font-semibold flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">error</span>
                    {apiError}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-on-surface">Target Building (Optional)</label>
                    <select
                      value={targetBuildingId}
                      onChange={(e) => setTargetBuildingId(e.target.value)}
                      className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl py-3 px-4 text-on-surface font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none transition-all"
                    >
                      <option value="">{t("roomChange.noPreference")}</option>
                      {buildings.map((b) => (
                        <option key={b.dorm_id} value={b.dorm_id}>{b.building_name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-on-surface">Reason for Room Change *</label>
                    <textarea
                      required
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Please explain why you'd like to change rooms..."
                      rows={5}
                      className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl py-3 px-4 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-primary text-white rounded-xl py-4 font-bold tracking-wide hover:opacity-90 transition-opacity disabled:opacity-70 flex justify-center items-center gap-2 shadow-soft"
                  >
                    {isSubmitting ? <span className="material-symbols-outlined animate-spin">refresh</span> : <span className="material-symbols-outlined">send</span>}
                    {t("maintenance.submit")}
                  </button>
                </form>
              </>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
