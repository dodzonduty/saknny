"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/i18n/useTranslation";
import { apiClient } from "@/services/api";

export default function AdminLeasesPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [isMounted, setIsMounted] = useState(false);
  const [allocationId, setAllocationId] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [expireLeaseId, setExpireLeaseId] = useState("");
  const [expireLoading, setExpireLoading] = useState(false);
  const [expireResult, setExpireResult] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("user_role");
    
    if (!token) {
      router.push("/auth");
    } else if (role !== "admin") {
      router.push("/dashboard");
    }
  }, [router]);

  const handleIssueLease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocationId) return;

    setLoading(true);
    setSuccessMessage(null);
    
    const payload = {
      allocation_id: parseInt(allocationId),
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : undefined
    };

    const res = await apiClient<any>("/admin/contracts/leases", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    if (res.success) {
      setSuccessMessage(`Lease #${res.data.lease_id} issued successfully!`);
      setAllocationId("");
      setExpiresAt("");
    } else {
      alert(res.error || "Failed to issue lease.");
    }
    setLoading(false);
  };

  if (!isMounted) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-full bg-primary-container text-primary flex items-center justify-center shadow-soft">
          <span className="material-symbols-outlined text-2xl">history_edu</span>
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-primary font-headline">
            {t("leases.adminTitle")}
          </h1>
          <p className="text-sm text-on-surface-variant">
            {t("leases.adminSubtitle")}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-soft p-8 border border-transparent">
        {successMessage && (
          <div className="mb-6 p-4 rounded-lg bg-emerald-50 text-emerald-800 text-sm font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">check_circle</span>
            {successMessage}
          </div>
        )}

        <form onSubmit={handleIssueLease} className="space-y-6 max-w-lg">
          <div>
            <label className="block text-sm font-bold text-on-surface mb-2">Allocation ID</label>
            <input 
              type="number" 
              required
              value={allocationId}
              onChange={e => setAllocationId(e.target.value)}
              className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              placeholder="Enter allocation ID..."
            />
            <p className="text-xs text-on-surface-variant mt-2">
              The student must have an 'assigned' allocation to receive a lease.
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-on-surface mb-2">Expiration Date (Optional)</label>
            <input 
              type="date" 
              value={expiresAt}
              onChange={e => setExpiresAt(e.target.value)}
              className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading || !allocationId}
            className="w-full bg-primary text-white px-6 py-4 rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {loading ? <span className="material-symbols-outlined animate-spin">refresh</span> : <span className="material-symbols-outlined">edit_document</span>}
            {t("leases.generateLease")}
          </button>
        </form>
      </div>

      {/* Expire Lease Section */}
      <div className="bg-white rounded-2xl shadow-soft p-8 border border-transparent">
        <h3 className="text-lg font-bold text-on-surface mb-6 font-headline flex items-center gap-2">
          <span className="material-symbols-outlined text-error">timer_off</span>
          Expire a Lease
        </h3>

        {expireResult && (
          <div className="mb-6 p-4 rounded-lg bg-amber-50 text-amber-800 text-sm font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">info</span>
            {expireResult}
          </div>
        )}

        <div className="flex items-end gap-4 max-w-lg">
          <div className="flex-grow">
            <label className="block text-sm font-bold text-on-surface mb-2">Lease ID</label>
            <input
              type="number"
              value={expireLeaseId}
              onChange={(e) => setExpireLeaseId(e.target.value)}
              placeholder="Enter lease ID to expire..."
              className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>
          <button
            onClick={async () => {
              if (!expireLeaseId) return;
              setExpireLoading(true);
              setExpireResult(null);
              const res = await apiClient<any>(`/admin/contracts/leases/${expireLeaseId}/expire`, { method: "POST" });
              if (res.success) {
                setExpireResult(`Lease #${res.data.lease_id} status set to "${res.data.status}".`);
                setExpireLeaseId("");
              } else {
                alert(res.error || "Failed to expire lease.");
              }
              setExpireLoading(false);
            }}
            disabled={expireLoading || !expireLeaseId}
            className="bg-error-container text-on-error-container px-6 py-3 rounded-xl font-bold hover:bg-error-container/80 transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
          >
            {expireLoading ? <span className="material-symbols-outlined animate-spin text-[18px]">refresh</span> : <span className="material-symbols-outlined text-[18px]">timer_off</span>}
            Expire Lease
          </button>
        </div>
      </div>

    </div>
  );
}
