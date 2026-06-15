"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/i18n/useTranslation";
import { apiClient } from "@/services/api";

export default function AdminCheckinsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [isMounted, setIsMounted] = useState(false);
  const [checkinId, setCheckinId] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [result, setResult] = useState<{ checkin_id: number; status: string } | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("user_role");
    if (!token) router.push("/auth");
    else if (role !== "admin") router.push("/dashboard");
  }, [router]);

  const handleIssueKey = async () => {
    if (!checkinId) return;
    setLoading(true);
    setApiError(null);
    setResult(null);

    const res = await apiClient<{ checkin_id: number; status: string }>(`/admin/checkins/${checkinId}/issue-key`, {
      method: "PUT",
    });

    if (res.success && res.data) {
      setResult(res.data);
      setCheckinId("");
    } else {
      setApiError(res.error || "Failed to issue key.");
    }
    setLoading(false);
  };

  if (!isMounted) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-full bg-primary-container text-white flex items-center justify-center shadow-soft">
          <span className="material-symbols-outlined text-2xl">key</span>
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-primary font-headline">{t("admin.checkinsTitle")}</h1>
          <p className="text-sm text-on-surface-variant">{t("admin.checkinsSubtitle")}</p>
        </div>
      </div>

      <div className="bg-white shadow-soft rounded-2xl p-8 border border-transparent">
        <h3 className="text-lg font-bold text-on-surface mb-6 font-headline flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">vpn_key</span>
          {t("admin.issueRoomKey")}
        </h3>

        <div className="space-y-6 max-w-md">
          <div>
            <label className="block text-sm font-bold text-on-surface mb-2">{t("admin.checkinIdLabel")}</label>
            <input
              type="number"
              value={checkinId}
              onChange={(e) => setCheckinId(e.target.value)}
              placeholder={t("admin.checkinIdPlaceholder")}
              className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
            <p className="text-xs text-on-surface-variant mt-2">
              {t("admin.checkinIdHint")}
            </p>
          </div>

          <button
            onClick={handleIssueKey}
            disabled={loading || !checkinId}
            className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 shadow-soft"
          >
            {loading ? <span className="material-symbols-outlined animate-spin">refresh</span> : <span className="material-symbols-outlined">lock_open</span>}
            {t("admin.issueKeyBtn")}
          </button>

          {apiError && (
            <div className="p-4 rounded-lg bg-error-container text-on-error-container text-sm font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">error</span>
              {apiError}
            </div>
          )}

          {result && (
            <div className="p-4 rounded-lg bg-emerald-50 text-emerald-800 text-sm font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">check_circle</span>
              Check-in #{result.checkin_id} — Status: <span className="uppercase font-black">{result.status.replace("_", " ")}</span>. Key issued successfully!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
