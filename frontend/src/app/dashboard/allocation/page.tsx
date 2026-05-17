"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardNavbar } from "@/components/dashboard/DashboardNavbar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { useTranslation } from "@/i18n/useTranslation";
import { apiClient } from "@/services/api";
import Link from "next/link";

interface Allocation {
  allocation_id: number;
  room_id: number;
  plan: string;
  status: string;
  assigned_at: string;
}

export default function StudentAllocationPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allocation, setAllocation] = useState<Allocation | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("user_role");
    
    if (!token) {
      router.push("/auth");
    } else if (role === "admin") {
      router.push("/admin");
    } else {
      fetchAllocation();
    }
  }, [router]);

  const fetchAllocation = async () => {
    setLoading(true);
    const res = await apiClient<{ allocation: Allocation | null }>("/allocations/me");
    if (res.success && res.data) {
      setAllocation(res.data.allocation);
    }
    setLoading(false);
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
              <span className="material-symbols-outlined text-2xl">meeting_room</span>
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-primary font-headline">
                {t("allocations.studentTitle")}
              </h1>
              <p className="text-sm text-on-surface-variant">
                {t("allocations.studentSubtitle")}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center">
              <span className="material-symbols-outlined text-primary text-4xl animate-spin">refresh</span>
            </div>
          ) : !allocation ? (
            <div className="bg-white shadow-soft rounded-2xl p-12 text-center border border-transparent">
              <div className="w-20 h-20 bg-surface-container-low rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-4xl text-outline-variant">bed</span>
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-2 font-headline">{t("allocations.emptyState")}</h3>
              <p className="text-on-surface-variant mb-8 max-w-md mx-auto">
                Once an administrator approves your application and assigns you a bed, your room details will appear here.
              </p>
              <Link 
                href="/dashboard/applications" 
                className="inline-flex items-center gap-2 bg-surface-container-high text-on-surface px-6 py-2.5 rounded-xl font-bold hover:bg-surface-container-highest transition-colors"
              >
                View Applications
              </Link>
            </div>
          ) : (
            <div className="bg-white shadow-soft rounded-2xl border border-transparent overflow-hidden">
              <div className="bg-primary/5 border-b-2 border-primary/10 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-xl font-bold text-on-surface font-headline flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">key</span>
                    Room Assignment #{allocation.allocation_id}
                  </h3>
                  <p className="text-sm text-on-surface-variant mt-1">
                    Assigned on {new Date(allocation.assigned_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  {allocation.status}
                </span>
              </div>
              
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-widest text-outline-variant mb-1">
                        {t("allocations.room")}
                      </div>
                      <div className="text-lg font-bold text-on-surface flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">meeting_room</span>
                        Room ID {allocation.room_id}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs font-bold uppercase tracking-widest text-outline-variant mb-1">
                        {t("allocations.plan")}
                      </div>
                      <div className="text-lg font-bold text-on-surface flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">restaurant</span>
                        <span className="capitalize">{allocation.plan.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-surface-container-lowest rounded-xl p-6 border-2 border-outline-variant/30 flex flex-col justify-center items-center text-center">
                    <span className="material-symbols-outlined text-4xl text-emerald-500 mb-2">verified</span>
                    <h4 className="font-bold text-on-surface">Allocation Confirmed</h4>
                    <p className="text-sm text-on-surface-variant mt-1">
                      Your room has been successfully reserved. Next, you can proceed to view and sign your lease.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
        </div>
      </main>
    </div>
  );
}
