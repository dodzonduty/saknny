"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/i18n/useTranslation";
import { apiClient } from "@/services/api";

interface VerificationDocument {
  doc_id: number;
  student_id: number;
  student_name: string;
  doc_type: string;
  status: string;
  file_url: string;
  is_flagged: boolean;
  created_at: string;
}

export default function AdminVerificationsPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [statusFilter, setStatusFilter] = useState("pending");

  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    setIsMounted(true);
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("user_role");
    
    if (!token) {
      router.push("/auth");
    } else if (role !== "admin") {
      router.push("/dashboard");
    } else {
      fetchVerifications(statusFilter);
    }
  }, [router, statusFilter]);

  const fetchVerifications = async (status: string) => {
    setLoading(true);
    const res = await apiClient<{ documents: VerificationDocument[] }>(`/admin/verifications?status=${status}`);
    if (res.success && res.data) {
      setDocuments(res.data.documents);
    }
    setLoading(false);
  };

  const handleReview = async (docId: number, status: "approved" | "rejected") => {
    if (status === "rejected" && !rejectionReason.trim()) {
      alert("Rejection reason is required.");
      return;
    }

    setActionLoadingId(docId);
    
    const payload = {
      status,
      rejection_reason: status === "rejected" ? rejectionReason : undefined
    };

    const res = await apiClient<any>(`/admin/verifications/${docId}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });

    if (res.success) {
      if (status === "rejected") {
        setRejectingId(null);
        setRejectionReason("");
      }
      fetchVerifications(statusFilter);
    } else {
      alert(res.error || "Failed to update verification status.");
    }
    setActionLoadingId(null);
  };

  if (!isMounted) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary-container text-white flex items-center justify-center shadow-soft">
            <span className="material-symbols-outlined text-2xl">verified_user</span>
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-primary font-headline">
              {t("admin.docVerificationTitle")}
            </h1>
            <p className="text-sm text-on-surface-variant">
              {t("admin.docVerificationSubtitle")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white rounded-xl shadow-soft p-2 border border-transparent flex-wrap">
          <button 
            onClick={() => setStatusFilter("pending")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${statusFilter === 'pending' ? 'bg-primary text-white' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
          >
            {t("admin.pendingFilter")}
          </button>
          <button 
            onClick={() => setStatusFilter("incomplete")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${statusFilter === 'incomplete' ? 'bg-primary text-white' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
          >
            {t("admin.incompleteFilter")}
          </button>
          <button 
            onClick={() => setStatusFilter("approved")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${statusFilter === 'approved' ? 'bg-primary text-white' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
          >
            {t("admin.approvedFilter")}
          </button>
          <button 
            onClick={() => setStatusFilter("rejected")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${statusFilter === 'rejected' ? 'bg-primary text-white' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
          >
            {t("admin.rejectedFilter")}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <span className="material-symbols-outlined text-primary text-4xl animate-spin">refresh</span>
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-white shadow-soft rounded-2xl p-12 text-center">
          <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">task</span>
          <h3 className="text-xl font-bold text-on-surface mb-2 font-headline">{t("admin.allCaughtUp")}</h3>
          <p className="text-on-surface-variant">{t("admin.noVerificationsStatus").replace("{{status}}", statusFilter)}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {documents.map(doc => (
            <div key={doc.doc_id} className="bg-white shadow-soft rounded-2xl p-6 border border-transparent hover:border-outline-variant/30 transition-colors flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
              
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-xl ${doc.status === 'approved' ? 'bg-emerald-50 text-emerald-800' : doc.status === 'rejected' ? 'bg-error-container text-on-error-container' : 'bg-blue-50 text-primary'}`}>
                  <span className="material-symbols-outlined text-2xl">
                    {doc.doc_type === "college_id" ? "badge" : "description"}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-on-surface">{doc.student_name}</h3>
                    <span className="text-xs text-on-surface-variant font-medium">(ID: {doc.student_id})</span>
                    {doc.is_flagged && (
                      <span className="bg-orange-50 text-orange-800 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded">{t("admin.flaggedText")}</span>
                    )}
                  </div>
                  <div className="text-sm font-medium text-on-surface-variant">
                    {t("admin.typeText")} <span className="uppercase">{doc.doc_type.replace("_", " ")}</span>
                  </div>
                  <div className="text-xs text-outline-variant mt-1">
                    {t("admin.submittedText")} {new Date(doc.created_at).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-start md:items-end gap-3 min-w-[200px]">
                <button
                  onClick={() => router.push(`/admin/verifications/${doc.doc_id}`)}
                  className="bg-primary text-white text-sm font-bold px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 w-full md:w-auto"
                >
                  <span className="material-symbols-outlined text-[18px]">visibility</span>
                  {t("admin.viewBtn")}
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
