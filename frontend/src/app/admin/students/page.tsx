"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/i18n/useTranslation";
import { apiClient } from "@/services/api";

export default function AdminStudentsPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [isMounted, setIsMounted] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ student_id: number; enroll_status: boolean } | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("user_role");
    if (!token) router.push("/auth");
    else if (role !== "admin") router.push("/dashboard");
  }, [router]);

  const handleSetEnrollment = async (enrollStatus: boolean) => {
    if (!studentId) return;
    setLoading(true);
    setApiError(null);
    setResult(null);

    const res = await apiClient<{ student_id: number; enroll_status: boolean }>(`/admin/students/${studentId}/enrollment`, {
      method: "PUT",
      body: JSON.stringify({ enroll_status: enrollStatus }),
    });

    if (res.success && res.data) {
      setResult(res.data);
    } else {
      setApiError(res.error || "Failed to update enrollment status.");
    }
    setLoading(false);
  };

  if (!isMounted) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-8">

      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-full bg-primary-container text-white flex items-center justify-center shadow-soft">
          <span className="material-symbols-outlined text-2xl">school</span>
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-primary font-headline">Student Enrollment</h1>
          <p className="text-sm text-on-surface-variant">Manually manage student enrollment verification status.</p>
        </div>
      </div>

      <div className="bg-white shadow-soft rounded-2xl p-8 border border-transparent">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-on-surface mb-2">Student ID</label>
            <input
              type="number"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="Enter student ID..."
              className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => handleSetEnrollment(true)}
              disabled={loading || !studentId}
              className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-bold hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">verified</span>
              Set Enrolled
            </button>
            <button
              onClick={() => handleSetEnrollment(false)}
              disabled={loading || !studentId}
              className="flex-1 bg-error-container text-on-error-container py-3 rounded-xl font-bold hover:bg-error-container/80 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">block</span>
              Revoke Enrollment
            </button>
          </div>

          {apiError && (
            <div className="p-4 rounded-lg bg-error-container text-on-error-container text-sm font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">error</span>
              {apiError}
            </div>
          )}

          {result && (
            <div className="p-4 rounded-lg bg-emerald-50 text-emerald-800 text-sm font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">check_circle</span>
              Student #{result.student_id} — Enrollment: {result.enroll_status ? "✅ Verified" : "❌ Revoked"}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
