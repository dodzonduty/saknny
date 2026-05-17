"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardNavbar } from "@/components/dashboard/DashboardNavbar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { useTranslation } from "@/i18n/useTranslation";
import { apiClient } from "@/services/api";

interface SurveyDispatch {
  dispatch_id: number;
  survey_id: number;
  title: string;
  status: string;
  sent_at: string;
  completed_at: string | null;
}

export default function SurveysPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [surveys, setSurveys] = useState<SurveyDispatch[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [responsePayload, setResponsePayload] = useState("{}");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("user_role");
    if (!token) router.push("/auth");
    else if (role === "admin") router.push("/admin");
    else fetchSurveys();
  }, [router]);

  const fetchSurveys = async () => {
    setLoading(true);
    const res = await apiClient<{ items: SurveyDispatch[] }>("/surveys/me");
    if (res.success && res.data) setSurveys(res.data.items);
    setLoading(false);
  };

  const handleComplete = async (dispatchId: number) => {
    let parsed: any;
    try {
      parsed = JSON.parse(responsePayload);
    } catch {
      alert("Invalid JSON. Please enter a valid JSON object.");
      return;
    }

    setActionLoading(dispatchId);
    const res = await apiClient<any>(`/surveys/${dispatchId}/complete`, {
      method: "POST",
      body: JSON.stringify({ response_payload: parsed }),
    });

    if (res.success) {
      setExpandedId(null);
      setResponsePayload("{}");
      fetchSurveys();
    } else {
      alert(res.error || "Failed to complete survey.");
    }
    setActionLoading(null);
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
              <span className="material-symbols-outlined text-2xl">poll</span>
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-primary font-headline">Surveys</h1>
              <p className="text-sm text-on-surface-variant">Complete assigned surveys to help improve housing services.</p>
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center"><span className="material-symbols-outlined text-primary text-4xl animate-spin">refresh</span></div>
          ) : surveys.length === 0 ? (
            <div className="bg-white shadow-soft rounded-2xl p-12 text-center border border-transparent">
              <div className="w-20 h-20 bg-surface-container-low rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-4xl text-outline-variant">ballot</span>
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-2 font-headline">No Surveys</h3>
              <p className="text-on-surface-variant">You don't have any surveys assigned at this time.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {surveys.map((s) => (
                <div key={s.dispatch_id} className="bg-white shadow-soft rounded-2xl p-6 border border-transparent">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-on-surface font-headline">{s.title}</h3>
                      <div className="text-xs text-on-surface-variant mt-1">Survey #{s.survey_id} • Sent {new Date(s.sent_at).toLocaleDateString()}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${
                        s.status === "completed" ? "bg-emerald-50 text-emerald-800" : "bg-blue-50 text-primary"
                      }`}>
                        {s.status}
                      </span>
                      {s.status === "sent" && (
                        <button
                          onClick={() => setExpandedId(expandedId === s.dispatch_id ? null : s.dispatch_id)}
                          className="bg-primary text-white text-sm font-bold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
                        >
                          {expandedId === s.dispatch_id ? "Cancel" : "Complete Survey"}
                        </button>
                      )}
                    </div>
                  </div>

                  {s.status === "completed" && s.completed_at && (
                    <div className="mt-3 text-xs text-emerald-700 font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">check_circle</span>
                      Completed on {new Date(s.completed_at).toLocaleDateString()}
                    </div>
                  )}

                  {expandedId === s.dispatch_id && (
                    <div className="mt-6 border-t-2 border-outline-variant/20 pt-6">
                      <label className="block text-sm font-bold text-on-surface mb-2">Response (JSON)</label>
                      <textarea
                        value={responsePayload}
                        onChange={(e) => setResponsePayload(e.target.value)}
                        rows={6}
                        className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:border-primary transition-all resize-none"
                        placeholder='{"satisfaction": 5, "comments": "Great experience!"}'
                      />
                      <button
                        onClick={() => handleComplete(s.dispatch_id)}
                        disabled={actionLoading === s.dispatch_id}
                        className="mt-4 bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        {actionLoading === s.dispatch_id ? <span className="material-symbols-outlined animate-spin text-[18px]">refresh</span> : <span className="material-symbols-outlined text-[18px]">task_alt</span>}
                        Submit Response
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
