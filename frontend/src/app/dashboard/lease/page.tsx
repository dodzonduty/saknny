"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardNavbar } from "@/components/dashboard/DashboardNavbar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { useTranslation } from "@/i18n/useTranslation";
import { apiClient } from "@/services/api";

interface Lease {
  lease_id: number;
  status: string;
  document_url: string;
  issued_at: string;
  expires_at: string | null;
  signed_at: string | null;
}

export default function StudentLeasePage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("user_role");
    
    if (!token) {
      router.push("/auth");
    } else if (role === "admin") {
      router.push("/admin");
    } else {
      fetchLeases();
    }
  }, [router]);

  const fetchLeases = async () => {
    setLoading(true);
    const res = await apiClient<{ items: Lease[] }>("/contracts/leases/me");
    if (res.success && res.data) {
      setLeases(res.data.items);
    }
    setLoading(false);
  };

  const handleSign = async (leaseId: number) => {
    setActionLoading(leaseId);
    const res = await apiClient<any>(`/contracts/leases/${leaseId}/sign`, {
      method: "PUT"
    });
    if (res.success) {
      fetchLeases();
    } else {
      alert(res.error || "Failed to sign lease");
    }
    setActionLoading(null);
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
              <span className="material-symbols-outlined text-2xl">draw</span>
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-primary font-headline">
                {t("leases.studentTitle")}
              </h1>
              <p className="text-sm text-on-surface-variant">
                {t("leases.studentSubtitle")}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center">
              <span className="material-symbols-outlined text-primary text-4xl animate-spin">refresh</span>
            </div>
          ) : leases.length === 0 ? (
            <div className="bg-white shadow-soft rounded-2xl p-12 text-center border border-transparent">
              <div className="w-20 h-20 bg-surface-container-low rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-4xl text-outline-variant">description</span>
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-2 font-headline">{t("leases.emptyState")}</h3>
              <p className="text-on-surface-variant max-w-md mx-auto">
                {t("leases.emptyStateDesc")}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {leases.map(lease => (
                <div key={lease.lease_id} className="bg-white shadow-soft rounded-2xl p-8 border border-transparent">
                  <div className="flex justify-between items-start border-b-2 border-outline-variant/20 pb-6 mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-on-surface font-headline mb-2 flex items-center gap-2">
                        {t("leases.leaseAgreement")}{lease.lease_id}
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded shadow-sm ${
                          lease.status === 'signed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {lease.status.replace("_", " ")}
                        </span>
                      </h3>
                      <p className="text-sm text-on-surface-variant">
                        {t("leases.issuedOn")} {new Date(lease.issued_at).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <a href={lease.document_url} target="_blank" rel="noreferrer" className="text-primary hover:text-primary/80 transition-colors bg-primary/10 p-3 rounded-full flex items-center justify-center">
                      <span className="material-symbols-outlined">download</span>
                    </a>
                  </div>
                  
                  <div className="prose prose-sm max-w-none text-on-surface-variant bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/30 h-64 overflow-y-auto mb-6">
                    <h4 className="font-bold text-on-surface text-lg">{t("leases.termsTitle")}</h4>
                    <p>{t("leases.termsIntro")}</p>
                    <ul>
                      <li>{t("leases.term1")}</li>
                      <li>{t("leases.term2")}</li>
                      <li>{t("leases.term3")}</li>
                      <li>{t("leases.term4")}</li>
                    </ul>
                    <p><em>{t("leases.termsNote")}</em></p>
                  </div>

                  {lease.status === "pending_signature" ? (
                    <button
                      onClick={() => handleSign(lease.lease_id)}
                      disabled={actionLoading === lease.lease_id}
                      className="w-full bg-primary text-white rounded-xl py-4 font-bold tracking-wide hover:opacity-90 transition-opacity disabled:opacity-70 flex justify-center items-center gap-2 shadow-soft"
                    >
                      {actionLoading === lease.lease_id ? (
                        <span className="material-symbols-outlined animate-spin">refresh</span>
                      ) : (
                        <span className="material-symbols-outlined">draw</span>
                      )}
                      {t("leases.signLease")}
                    </button>
                  ) : (
                    <div className="w-full bg-emerald-50 text-emerald-800 border-2 border-emerald-200 rounded-xl py-4 font-bold tracking-wide flex justify-center items-center gap-2">
                      <span className="material-symbols-outlined">verified</span>
                      {t("leases.signed")} {lease.signed_at ? new Date(lease.signed_at).toLocaleDateString() : t("dashboardAdditions.unknown")}
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
