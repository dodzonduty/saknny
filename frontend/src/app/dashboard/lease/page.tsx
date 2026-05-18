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
      
      <main className="lg:ml-64 pt-24 pb-12 px-8 flex-grow">
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
                Once an administrator issues your housing contract, it will appear here for you to review and sign.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {leases.map(lease => (
                <div key={lease.lease_id} className="bg-white shadow-soft rounded-2xl p-8 border border-transparent">
                  <div className="flex justify-between items-start border-b-2 border-outline-variant/20 pb-6 mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-on-surface font-headline mb-2 flex items-center gap-2">
                        Lease Agreement #{lease.lease_id}
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded shadow-sm ${
                          lease.status === 'signed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {lease.status.replace("_", " ")}
                        </span>
                      </h3>
                      <p className="text-sm text-on-surface-variant">
                        Issued on {new Date(lease.issued_at).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <a href={lease.document_url} target="_blank" rel="noreferrer" className="text-primary hover:text-primary/80 transition-colors bg-primary/10 p-3 rounded-full flex items-center justify-center">
                      <span className="material-symbols-outlined">download</span>
                    </a>
                  </div>
                  
                  <div className="prose prose-sm max-w-none text-on-surface-variant bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/30 h-64 overflow-y-auto mb-6">
                    <h4 className="font-bold text-on-surface text-lg">Terms and Conditions</h4>
                    <p>By signing this lease agreement, you ("The Student") agree to the following conditions regarding your occupancy at Sakny University Housing:</p>
                    <ul>
                      <li>The Student shall pay all housing fees and meal plan charges on or before the specified due dates.</li>
                      <li>The Student agrees to abide by all university housing rules, including noise ordinances and guest policies.</li>
                      <li>Sakny Housing reserves the right to terminate this lease in the event of disciplinary action or failure to pay dues.</li>
                      <li>The Student is responsible for maintaining the room in good condition. Damages will be billed to the Student's account.</li>
                    </ul>
                    <p><em>Note: This is a digital representation of the contract. The official document can be downloaded via the icon above.</em></p>
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
                      {t("leases.signed")} on {lease.signed_at ? new Date(lease.signed_at).toLocaleDateString() : 'Unknown'}
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
