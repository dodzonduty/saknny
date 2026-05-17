"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/i18n/useTranslation";
import { apiClient } from "@/services/api";

export default function AdminSurveysPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [isMounted, setIsMounted] = useState(false);

  // Create Survey
  const [surveyTitle, setSurveyTitle] = useState("");
  const [surveyDesc, setSurveyDesc] = useState("");
  const [surveyActive, setSurveyActive] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [createResult, setCreateResult] = useState<{ survey_id: number } | null>(null);

  // Dispatch Survey
  const [dispatchSurveyId, setDispatchSurveyId] = useState("");
  const [dispatchStudentIds, setDispatchStudentIds] = useState("");
  const [dispatchLoading, setDispatchLoading] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<{ survey_id: number; dispatched_count: number } | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("user_role");
    if (!token) router.push("/auth");
    else if (role !== "admin") router.push("/dashboard");
  }, [router]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!surveyTitle.trim()) return;
    setCreateLoading(true);
    setCreateResult(null);

    const res = await apiClient<{ survey_id: number }>("/admin/surveys", {
      method: "POST",
      body: JSON.stringify({ title: surveyTitle.trim(), description: surveyDesc.trim() || null, is_active: surveyActive }),
    });

    if (res.success && res.data) {
      setCreateResult(res.data);
      setSurveyTitle("");
      setSurveyDesc("");
    } else {
      alert(res.error || "Failed to create survey.");
    }
    setCreateLoading(false);
  };

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchSurveyId) return;
    setDispatchLoading(true);
    setDispatchResult(null);

    const studentIds = dispatchStudentIds.trim()
      ? dispatchStudentIds.split(",").map((s) => parseInt(s.trim())).filter((n) => !isNaN(n))
      : null;

    const res = await apiClient<{ survey_id: number; dispatched_count: number }>(`/admin/surveys/${dispatchSurveyId}/dispatch`, {
      method: "POST",
      body: JSON.stringify({ student_ids: studentIds }),
    });

    if (res.success && res.data) {
      setDispatchResult(res.data);
      setDispatchStudentIds("");
    } else {
      alert(res.error || "Failed to dispatch survey.");
    }
    setDispatchLoading(false);
  };

  if (!isMounted) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-full bg-primary-container text-primary flex items-center justify-center shadow-soft">
          <span className="material-symbols-outlined text-2xl">poll</span>
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-primary font-headline">Survey Management</h1>
          <p className="text-sm text-on-surface-variant">Create and distribute surveys to students.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Create Survey */}
        <div className="bg-white shadow-soft rounded-2xl p-8 border border-transparent">
          <h3 className="text-lg font-bold text-on-surface mb-6 font-headline flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">add_chart</span>
            Create Survey
          </h3>

          {createResult && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 text-emerald-800 text-sm font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              Survey #{createResult.survey_id} created!
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-outline-variant mb-1">Title</label>
              <input type="text" required value={surveyTitle} onChange={(e) => setSurveyTitle(e.target.value)} placeholder="Survey title..." className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-3 py-2 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-outline-variant mb-1">Description</label>
              <textarea value={surveyDesc} onChange={(e) => setSurveyDesc(e.target.value)} placeholder="Optional description..." rows={3} className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-3 py-2 text-sm outline-none focus:border-primary resize-none" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="surveyActive" checked={surveyActive} onChange={(e) => setSurveyActive(e.target.checked)} className="w-4 h-4 accent-primary" />
              <label htmlFor="surveyActive" className="text-sm font-semibold text-on-surface">Active</label>
            </div>
            <button type="submit" disabled={createLoading} className="w-full bg-primary text-white rounded-xl py-3 font-bold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
              {createLoading ? <span className="material-symbols-outlined animate-spin text-[18px]">refresh</span> : <span className="material-symbols-outlined text-[18px]">add</span>}
              Create Survey
            </button>
          </form>
        </div>

        {/* Dispatch Survey */}
        <div className="bg-white shadow-soft rounded-2xl p-8 border border-transparent">
          <h3 className="text-lg font-bold text-on-surface mb-6 font-headline flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">send</span>
            Dispatch Survey
          </h3>

          {dispatchResult && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 text-emerald-800 text-sm font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              Survey #{dispatchResult.survey_id} dispatched to {dispatchResult.dispatched_count} student(s)!
            </div>
          )}

          <form onSubmit={handleDispatch} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-outline-variant mb-1">Survey ID</label>
              <input type="number" required value={dispatchSurveyId} onChange={(e) => setDispatchSurveyId(e.target.value)} placeholder="e.g. 1" className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-3 py-2 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-outline-variant mb-1">Student IDs (comma-separated)</label>
              <input type="text" value={dispatchStudentIds} onChange={(e) => setDispatchStudentIds(e.target.value)} placeholder="Leave empty for all students" className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-3 py-2 text-sm outline-none focus:border-primary" />
              <p className="text-xs text-on-surface-variant mt-1">Leave blank to dispatch to all registered students.</p>
            </div>
            <button type="submit" disabled={dispatchLoading} className="w-full bg-emerald-500 text-white rounded-xl py-3 font-bold hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-2">
              {dispatchLoading ? <span className="material-symbols-outlined animate-spin text-[18px]">refresh</span> : <span className="material-symbols-outlined text-[18px]">send</span>}
              Dispatch
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
