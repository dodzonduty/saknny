"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/i18n/useTranslation";
import { apiClient } from "@/services/api";
import Link from "next/link";

interface AnalyticsData {
  occupancy_rate: number;
  total_rooms: number;
  total_beds: number;
  total_available_beds: number;
  applications: Record<string, number>;
  payments: Record<string, number>;
  tickets: Record<string, number>;
  active_allocations: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("user_role");
    
    if (!token) {
      router.push("/auth");
    } else if (role !== "admin") {
      router.push("/dashboard");
    } else {
      fetchAnalytics();
    }
  }, [router]);

  const fetchAnalytics = async () => {
    setLoading(true);
    const res = await apiClient<AnalyticsData>("/admin/analytics/dashboard");
    if (res.success && res.data) {
      setData(res.data);
    }
    setLoading(false);
  };

  if (!isMounted) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary to-blue-800 rounded-2xl p-8 text-white shadow-soft relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-block bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
            Administrator
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-2 font-headline">
            System Overview
          </h1>
          <p className="text-blue-100 max-w-xl">
            Monitor real-time housing metrics, track occupancy, and review pending administrative tasks across the Sakny portal.
          </p>
        </div>
        <span className="material-symbols-outlined absolute -right-4 -bottom-10 text-[180px] text-white/5 pointer-events-none transform -rotate-12">
          insights
        </span>
      </div>

      {loading || !data ? (
        <div className="py-12 flex justify-center">
          <span className="material-symbols-outlined text-primary text-4xl animate-spin">refresh</span>
        </div>
      ) : (
        <>
          {/* Top Level Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-soft border border-transparent">
              <div className="flex items-center gap-3 mb-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-emerald-500">pie_chart</span>
                <span className="text-sm font-bold uppercase tracking-widest">Occupancy Rate</span>
              </div>
              <div className="text-4xl font-black text-on-surface">{data.occupancy_rate}%</div>
              <div className="mt-2 text-xs font-medium text-outline-variant">Target: 95%</div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-soft border border-transparent">
              <div className="flex items-center gap-3 mb-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-blue-500">king_bed</span>
                <span className="text-sm font-bold uppercase tracking-widest">Available Beds</span>
              </div>
              <div className="text-4xl font-black text-on-surface">
                {data.total_available_beds} <span className="text-lg font-bold text-outline-variant">/ {data.total_beds}</span>
              </div>
              <div className="mt-2 text-xs font-medium text-outline-variant">Across {data.total_rooms} rooms</div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-soft border border-transparent">
              <div className="flex items-center gap-3 mb-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-primary">assignment_turned_in</span>
                <span className="text-sm font-bold uppercase tracking-widest">Active Allocations</span>
              </div>
              <div className="text-4xl font-black text-on-surface">{data.active_allocations}</div>
              <div className="mt-2 text-xs font-medium text-outline-variant">Students assigned</div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-soft border border-transparent border-t-4 border-t-orange-400">
              <div className="flex items-center gap-3 mb-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-orange-500">home_repair_service</span>
                <span className="text-sm font-bold uppercase tracking-widest">Open Tickets</span>
              </div>
              <div className="text-4xl font-black text-on-surface">
                {data.tickets.open || 0}
              </div>
              <div className="mt-2 text-xs font-medium text-outline-variant">Requires attention</div>
            </div>
          </div>

          {/* Breakdown Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Applications Breakdown */}
            <div className="bg-white rounded-2xl shadow-soft p-6 border border-transparent">
              <h3 className="text-lg font-bold text-on-surface mb-6 font-headline flex items-center justify-between">
                <span>Housing Applications</span>
                <Link href="/admin/applications" className="text-xs font-bold text-primary hover:underline">View All</Link>
              </h3>
              <div className="space-y-4">
                {Object.entries(data.applications).length === 0 ? (
                  <div className="text-sm text-outline-variant">No applications yet.</div>
                ) : (
                  Object.entries(data.applications).map(([status, count]) => (
                    <div key={status} className="flex justify-between items-center">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${
                        status === 'approved' ? 'bg-emerald-50 text-emerald-800' :
                        status === 'submitted' || status === 'under_review' ? 'bg-amber-50 text-amber-800' :
                        'bg-surface-container-high text-on-surface-variant'
                      }`}>
                        {status.replace("_", " ")}
                      </span>
                      <span className="font-bold text-on-surface">{count}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Payments Breakdown */}
            <div className="bg-white rounded-2xl shadow-soft p-6 border border-transparent">
              <h3 className="text-lg font-bold text-on-surface mb-6 font-headline flex items-center justify-between">
                <span>Payment Status</span>
                <Link href="/admin/billing" className="text-xs font-bold text-primary hover:underline">View All</Link>
              </h3>
              <div className="space-y-4">
                {Object.entries(data.payments).length === 0 ? (
                  <div className="text-sm text-outline-variant">No payments yet.</div>
                ) : (
                  Object.entries(data.payments).map(([status, count]) => (
                    <div key={status} className="flex justify-between items-center">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${
                        status === 'paid' ? 'bg-emerald-50 text-emerald-800' :
                        status === 'refunded' ? 'bg-error-container text-on-error-container' :
                        'bg-blue-50 text-primary'
                      }`}>
                        {status.replace("_", " ")}
                      </span>
                      <span className="font-bold text-on-surface">{count}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Tickets Breakdown */}
            <div className="bg-white rounded-2xl shadow-soft p-6 border border-transparent">
              <h3 className="text-lg font-bold text-on-surface mb-6 font-headline flex items-center justify-between">
                <span>Maintenance</span>
                <Link href="/admin/maintenance" className="text-xs font-bold text-primary hover:underline">View All</Link>
              </h3>
              <div className="space-y-4">
                {Object.entries(data.tickets).length === 0 ? (
                  <div className="text-sm text-outline-variant">No tickets yet.</div>
                ) : (
                  Object.entries(data.tickets).map(([status, count]) => (
                    <div key={status} className="flex justify-between items-center">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${
                        status === 'resolved' ? 'bg-emerald-50 text-emerald-800' :
                        status === 'open' || status === 'escalated' ? 'bg-orange-50 text-orange-800' :
                        'bg-blue-50 text-primary'
                      }`}>
                        {status.replace("_", " ")}
                      </span>
                      <span className="font-bold text-on-surface">{count}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}
