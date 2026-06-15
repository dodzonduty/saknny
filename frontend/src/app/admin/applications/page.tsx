"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/i18n/useTranslation";
import { apiClient } from "@/services/api";

interface Application {
  app_id: number;
  student_id: number;
  student_name: string;
  status: string;
  preferred_dorm_id: number | null;
  preferred_dorm_name?: string | null;
  submission_date: string;
}

export default function AdminApplicationsPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [statusFilter, setStatusFilter] = useState("submitted");

  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [comments, setComments] = useState("");

  useEffect(() => {
    setIsMounted(true);
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("user_role");
    
    if (!token) {
      router.push("/auth");
    } else if (role !== "admin") {
      router.push("/dashboard");
    } else {
      fetchApplications(statusFilter);
    }
  }, [router, statusFilter]);

  const fetchApplications = async (status: string) => {
    setLoading(true);
    const res = await apiClient<{ items: Application[] }>(`/admin/applications?status=${status}`);
    if (res.success && res.data) {
      setApplications(res.data.items);
    }
    setLoading(false);
  };

  const handleReviewAction = async (appId: number, endpoint: "review" | "finalize", actionPayload: any) => {
    setActionLoadingId(appId);
    
    const res = await apiClient<any>(`/admin/applications/${appId}/${endpoint}`, {
      method: "PUT",
      body: JSON.stringify(actionPayload)
    });

    if (res.success) {
      setExpandedId(null);
      setComments("");
      fetchApplications(statusFilter);
    } else {
      alert(res.error || "Failed to update application.");
    }
    setActionLoadingId(null);
  };

  if (!isMounted) return null;

  const getStatusTabs = () => [
    { id: "submitted", label: "New (Submitted)" },
    { id: "under_review", label: "Under Review" },
    { id: "waitlisted", label: "Waitlisted" },
    { id: "approved", label: "Approved" },
    { id: "rejected", label: "Rejected" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary-container text-white flex items-center justify-center shadow-soft">
            <span className="material-symbols-outlined text-2xl">folder_shared</span>
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-primary font-headline">
              Application Queue
            </h1>
            <p className="text-sm text-on-surface-variant">
              Review and process student housing applications.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-soft border border-transparent p-1 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {getStatusTabs().map(tab => (
            <button 
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-6 py-3 rounded-lg text-sm font-bold transition-colors ${
                statusFilter === tab.id 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <span className="material-symbols-outlined text-primary text-4xl animate-spin">refresh</span>
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-white shadow-soft rounded-2xl p-12 text-center">
          <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">inbox</span>
          <h3 className="text-xl font-bold text-on-surface mb-2 font-headline">Queue Empty</h3>
          <p className="text-on-surface-variant">No applications currently in "{statusFilter}" status.</p>
        </div>
      ) : (
        <div className="bg-white shadow-soft rounded-2xl border border-transparent overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-container-lowest border-b-2 border-outline-variant/30">
                <tr>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-on-surface-variant">ID</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-on-surface-variant">Student</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-on-surface-variant">Preferred Dorm</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-on-surface-variant">Date</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-on-surface-variant text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {applications.map(app => (
                  <React.Fragment key={app.app_id}>
                    <tr className="hover:bg-surface-container-lowest/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-primary">#{app.app_id}</td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-on-surface">{app.student_name}</div>
                        <div className="text-xs text-on-surface-variant">ID: {app.student_id}</div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-on-surface-variant">
                        {app.preferred_dorm_name ? app.preferred_dorm_name : "Any"}
                      </td>
                      <td className="px-6 py-4 text-sm text-on-surface-variant">
                        {new Date(app.submission_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setExpandedId(expandedId === app.app_id ? null : app.app_id)}
                          className="bg-surface-container-low text-on-surface px-4 py-2 rounded-lg text-sm font-bold hover:bg-surface-container-high transition-colors"
                        >
                          {expandedId === app.app_id ? "Close" : "Review"}
                        </button>
                      </td>
                    </tr>
                    
                    {/* Expanded Action Panel */}
                    {expandedId === app.app_id && (
                      <tr className="bg-surface-container-lowest">
                        <td colSpan={5} className="px-6 py-6 border-l-4 border-primary">
                          <div className="max-w-3xl space-y-4">
                            <h4 className="font-bold text-on-surface flex items-center gap-2">
                              <span className="material-symbols-outlined text-[18px]">gavel</span>
                              Review Actions
                            </h4>
                            
                            <textarea
                              placeholder="Optional comments or rejection reason..."
                              value={comments}
                              onChange={e => setComments(e.target.value)}
                              rows={2}
                              className="w-full bg-white border-2 border-outline-variant rounded-xl p-3 text-sm focus:outline-none focus:border-primary transition-colors"
                            />

                            <div className="flex flex-wrap gap-3 pt-2">
                              {app.status === "submitted" && (
                                <button
                                  onClick={() => handleReviewAction(app.app_id, "review", { status: "under_review", review_action: "mark_under_review", comments })}
                                  disabled={actionLoadingId === app.app_id}
                                  className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-200 transition-colors"
                                >
                                  Mark Under Review
                                </button>
                              )}
                              
                              {(app.status === "submitted" || app.status === "under_review") && (
                                <button
                                  onClick={() => handleReviewAction(app.app_id, "review", { status: "waitlisted", review_action: "move_to_waitlist", comments })}
                                  disabled={actionLoadingId === app.app_id}
                                  className="bg-orange-100 text-orange-800 px-4 py-2 rounded-lg text-sm font-bold hover:bg-orange-200 transition-colors"
                                >
                                  Move to Waitlist
                                </button>
                              )}

                              <button
                                onClick={() => handleReviewAction(app.app_id, "finalize", { status: "approved", comments })}
                                disabled={actionLoadingId === app.app_id}
                                className="bg-emerald-500 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-emerald-600 transition-colors flex items-center gap-1 ml-auto"
                              >
                                <span className="material-symbols-outlined text-[16px]">check_circle</span> Approve
                              </button>
                              
                              <button
                                onClick={() => {
                                  if (!comments.trim()) { alert("Comments are required for rejection."); return; }
                                  handleReviewAction(app.app_id, "finalize", { status: "rejected", comments })
                                }}
                                disabled={actionLoadingId === app.app_id}
                                className="bg-error-container text-on-error-container px-6 py-2 rounded-lg text-sm font-bold hover:bg-error-container/80 transition-colors flex items-center gap-1"
                              >
                                <span className="material-symbols-outlined text-[16px]">cancel</span> Reject
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
