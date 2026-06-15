"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/i18n/useTranslation";
import { apiClient } from "@/services/api";

interface RoomChangeReq {
  request_id: number;
  student_id: number;
  student_name?: string;
  current_room_id: number | null;
  current_room_number?: string;
  target_building_id: number | null;
  target_building_name?: string;
  status: string;
  reason: string;
}

export default function AdminRoomChangesPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<RoomChangeReq[]>([]);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("user_role");
    if (!token) router.push("/auth");
    else if (role !== "admin") router.push("/dashboard");
    else fetchRequests();
  }, [router]);

  const fetchRequests = async () => {
    setLoading(true);
    const res = await apiClient<{ items: RoomChangeReq[] }>("/admin/lifecycle/room-change");
    if (res.success && res.data) setRequests(res.data.items);
    setLoading(false);
  };

  const handleReview = async (requestId: number, status: "approved" | "rejected") => {
    setActionLoadingId(requestId);
    const res = await apiClient<any>(`/admin/lifecycle/room-change/${requestId}/review`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
    if (res.success) {
      fetchRequests();
    } else {
      alert(res.error || "Failed to update request.");
    }
    setActionLoadingId(null);
  };

  if (!isMounted) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-primary-container text-white flex items-center justify-center shadow-soft">
          <span className="material-symbols-outlined text-2xl">swap_horiz</span>
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-primary font-headline">{t("admin.roomChangesTitle")}</h1>
          <p className="text-sm text-on-surface-variant">{t("admin.roomChangesSubtitle")}</p>
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center"><span className="material-symbols-outlined text-primary text-4xl animate-spin">refresh</span></div>
      ) : requests.length === 0 ? (
        <div className="bg-white shadow-soft rounded-2xl p-12 text-center">
          <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">compare_arrows</span>
          <h3 className="text-xl font-bold text-on-surface mb-2 font-headline">{t("admin.noRequestsTitle")}</h3>
          <p className="text-on-surface-variant">{t("admin.noRequestsDesc")}</p>
        </div>
      ) : (
        <div className="bg-white shadow-soft rounded-2xl border border-transparent overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-container-lowest border-b-2 border-outline-variant/30">
                <tr>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-on-surface-variant">ID</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-on-surface-variant">{t("admin.studentCol")}</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-on-surface-variant">{t("admin.currentRoomCol")}</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-on-surface-variant">{t("admin.targetBuildingCol")}</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-on-surface-variant">{t("admin.reasonCol")}</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-on-surface-variant">Status</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-on-surface-variant text-right">{t("admin.actionsCol")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {requests.map((req) => (
                  <tr key={req.request_id} className="hover:bg-surface-container-lowest/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-primary">#{req.request_id}</td>
                    <td className="px-6 py-4 font-semibold text-on-surface">
                      {req.student_name ? (
                        <div>
                          <div className="font-bold text-on-surface">{req.student_name}</div>
                          <div className="text-xs text-on-surface-variant font-medium">ID: {req.student_id}</div>
                        </div>
                      ) : (
                        req.student_id
                      )}
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant">
                      {req.current_room_id ? (
                        req.current_room_number ? (
                          <div>
                            <div className="font-bold text-on-surface">Room {req.current_room_number}</div>
                            <div className="text-xs text-on-surface-variant font-medium">ID: {req.current_room_id}</div>
                          </div>
                        ) : (
                          req.current_room_id
                        )
                      ) : (
                        t("admin.naText")
                      )}
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant">
                      {req.target_building_id ? (
                        req.target_building_name ? (
                          <div>
                            <div className="font-bold text-on-surface">{req.target_building_name}</div>
                            <div className="text-xs text-on-surface-variant font-medium">ID: {req.target_building_id}</div>
                          </div>
                        ) : (
                          req.target_building_id
                        )
                      ) : (
                        t("admin.anyText")
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant max-w-[200px] truncate">{req.reason}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${
                        req.status === "approved" ? "bg-emerald-50 text-emerald-800" :
                        req.status === "rejected" ? "bg-error-container text-on-error-container" :
                        "bg-amber-50 text-amber-800"
                      }`}>{req.status.replace("_", " ")}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {req.status === "pending_review" && (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleReview(req.request_id, "approved")} disabled={actionLoadingId === req.request_id} className="text-xs font-bold bg-emerald-500 text-white px-3 py-1.5 rounded hover:bg-emerald-600 disabled:opacity-50">{t("admin.approveBtn")}</button>
                          <button onClick={() => handleReview(req.request_id, "rejected")} disabled={actionLoadingId === req.request_id} className="text-xs font-bold bg-error-container text-on-error-container px-3 py-1.5 rounded hover:bg-error-container/80 disabled:opacity-50">{t("admin.rejectBtn")}</button>
                        </div>
                      )}
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
