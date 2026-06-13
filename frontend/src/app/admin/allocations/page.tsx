"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/i18n/useTranslation";
import { apiClient } from "@/services/api";

interface Allocation {
  allocation_id: number;
  student_id: number;
  student_name?: string;
  room_id: number;
  room_number?: string;
  plan: string;
  status: string;
  assigned_at: string;
}

export default function AdminAllocationsPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  
  const [showManualForm, setShowManualForm] = useState(false);
  const [appId, setAppId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [plan, setPlan] = useState("full_board");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("user_role");
    
    if (!token) {
      router.push("/auth");
    } else if (role !== "admin") {
      router.push("/dashboard");
    } else {
      fetchAllocations();
    }
  }, [router]);

  const fetchAllocations = async () => {
    setLoading(true);
    const res = await apiClient<{ items: Allocation[] }>("/admin/allocations");
    if (res.success && res.data) {
      setAllocations(res.data.items);
    }
    setLoading(false);
  };

  const handleManualAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appId || !roomId || !plan) return;

    setActionLoading(true);
    
    const payload = {
      app_id: parseInt(appId),
      room_id: parseInt(roomId),
      plan
    };

    const res = await apiClient<any>("/admin/allocations", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    if (res.success) {
      setShowManualForm(false);
      setAppId("");
      setRoomId("");
      fetchAllocations();
    } else {
      alert(res.error || "Failed to assign allocation.");
    }
    setActionLoading(false);
  };

  if (!isMounted) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary-container text-white flex items-center justify-center shadow-soft">
            <span className="material-symbols-outlined text-2xl">bed</span>
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-primary font-headline">
              {t("allocations.adminTitle")}
            </h1>
            <p className="text-sm text-on-surface-variant">
              {t("allocations.adminSubtitle")}
            </p>
          </div>
        </div>

        <button 
          onClick={() => setShowManualForm(!showManualForm)}
          className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center gap-2 shadow-soft"
        >
          <span className="material-symbols-outlined">add_task</span>
          {showManualForm ? "Cancel Assignment" : t("allocations.manualAssign")}
        </button>
      </div>

      {showManualForm && (
        <div className="bg-white rounded-2xl shadow-soft p-6 border-l-4 border-primary">
          <h3 className="text-lg font-bold text-on-surface mb-4">Manual Room Assignment</h3>
          <form onSubmit={handleManualAssign} className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Application ID</label>
              <input 
                type="number" 
                required
                value={appId}
                onChange={e => setAppId(e.target.value)}
                className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-4 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                placeholder="e.g. 1"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Room ID</label>
              <input 
                type="number" 
                required
                value={roomId}
                onChange={e => setRoomId(e.target.value)}
                className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-4 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                placeholder="e.g. 101"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Meal Plan</label>
              <select 
                value={plan}
                onChange={e => setPlan(e.target.value)}
                className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-4 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="full_board">Full Board</option>
                <option value="breakfast">Breakfast Only</option>
              </select>
            </div>
            <button 
              type="submit" 
              disabled={actionLoading}
              className="bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-emerald-600 transition-colors disabled:opacity-50"
            >
              {actionLoading ? "Assigning..." : "Assign Room"}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="py-12 flex justify-center">
          <span className="material-symbols-outlined text-primary text-4xl animate-spin">refresh</span>
        </div>
      ) : allocations.length === 0 ? (
        <div className="bg-white shadow-soft rounded-2xl p-12 text-center">
          <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">king_bed</span>
          <h3 className="text-xl font-bold text-on-surface mb-2 font-headline">No Allocations Yet</h3>
          <p className="text-on-surface-variant">There are currently no active room assignments.</p>
        </div>
      ) : (
        <div className="bg-white shadow-soft rounded-2xl border border-transparent overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-container-lowest border-b-2 border-outline-variant/30">
                <tr>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-on-surface-variant">ID</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-on-surface-variant">Student</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-on-surface-variant">Room</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-on-surface-variant">Plan</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-on-surface-variant">Status</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-on-surface-variant">Assigned At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {allocations.map(alloc => (
                  <tr key={alloc.allocation_id} className="hover:bg-surface-container-lowest/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-primary">#{alloc.allocation_id}</td>
                    <td className="px-6 py-4 font-semibold text-on-surface">
                      {alloc.student_name ? (
                        <div>
                          <div className="font-bold text-on-surface">{alloc.student_name}</div>
                          <div className="text-xs text-on-surface-variant font-medium">ID: {alloc.student_id}</div>
                        </div>
                      ) : (
                        alloc.student_id
                      )}
                    </td>
                    <td className="px-6 py-4 font-semibold text-on-surface">
                      {alloc.room_number ? (
                        <div>
                          <div className="font-bold text-on-surface">Room {alloc.room_number}</div>
                          <div className="text-xs text-on-surface-variant font-medium">ID: {alloc.room_id}</div>
                        </div>
                      ) : (
                        alloc.room_id
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant capitalize">{alloc.plan.replace('_', ' ')}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${
                        alloc.status === 'active' || alloc.status === 'assigned' ? 'bg-emerald-50 text-emerald-800' : 'bg-blue-50 text-primary'
                      }`}>
                        {alloc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">
                      {new Date(alloc.assigned_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
