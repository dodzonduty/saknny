"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/i18n/useTranslation";
import { apiClient, API_BASE_URL } from "@/services/api";

interface Allocation {
  allocation_id: number;
  student_id: number;
  student_name?: string;
  room_id: number;
  room_number?: string;
  building_name?: string;
  plan: string;
  status: string;
  assigned_at: string;
}

interface Room {
  room_id: number;
  dorm_id: number;
  room_number: string;
  available_beds: number;
}

interface Building {
  dorm_id: number;
  building_name: string;
}

export default function AdminAllocationsPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  
  const [showManualForm, setShowManualForm] = useState(false);
  const [appId, setAppId] = useState("");
  const [selectedAppDormId, setSelectedAppDormId] = useState<number | null>(null);
  const [roomId, setRoomId] = useState("");
  const [plan, setPlan] = useState("full_board");
  const [actionLoading, setActionLoading] = useState(false);

  // AI Auto Assign State
  const [showAutoAssign, setShowAutoAssign] = useState(false);
  const [autoDormId, setAutoDormId] = useState("");
  const [autoSessionId, setAutoSessionId] = useState<number | null>(null);
  const [autoPreview, setAutoPreview] = useState<Record<string, number> | null>(null);
  const [autoSessionData, setAutoSessionData] = useState<any>(null);
  const [expandedCluster, setExpandedCluster] = useState<string | null>(null);
  const [studentToRemove, setStudentToRemove] = useState<number | null>(null);
  const [autoLoading, setAutoLoading] = useState(false);

  useEffect(() => {
    const fetchAppDetails = async () => {
      if (!appId || isNaN(parseInt(appId))) {
        setSelectedAppDormId(null);
        return;
      }
      const res = await apiClient<any>(`/admin/applications/${appId}`);
      if (res.success && res.data && res.data.application) {
        setSelectedAppDormId(res.data.application.preferred_dorm_id);
      } else {
        setSelectedAppDormId(null);
      }
    };
    
    const timeoutId = setTimeout(() => {
      fetchAppDetails();
    }, 400);
    return () => clearTimeout(timeoutId);
  }, [appId]);

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
      fetchCatalog();
    }
  }, [router]);

  const fetchCatalog = async () => {
    const rRes = await apiClient<{items: Room[]}>("/catalog/rooms");
    if (rRes.success && rRes.data) setRooms(rRes.data.items);
    
    const bRes = await apiClient<{items: Building[]}>("/catalog/buildings");
    if (bRes.success && bRes.data) setBuildings(bRes.data.items);
  };

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

  const handleGenerateClusters = async () => {
    if (!autoDormId) return alert("Please select a target dorm.");
    setAutoLoading(true);
    
    // 1. Fetch active questionnaire implicitly
    const qRes = await apiClient<{items: any[]}>("/admin/compatibility/questionnaires");
    const activeQ = qRes.data?.items?.find((q: any) => q.is_active);
    if (!activeQ) {
      alert("No active compatibility questionnaire found.");
      setAutoLoading(false);
      return;
    }
    
    // 2. Start clustering session
    const clusterRes = await apiClient<{session_id: number}>("/admin/compatibility/cluster", {
      method: "POST",
      body: JSON.stringify({
        questionnaire_id: activeQ.questionnaire_id,
        dorm_id: parseInt(autoDormId)
      })
    });
    
    if (!clusterRes.success || !clusterRes.data) {
      alert(clusterRes.error || "Clustering failed.");
      setAutoLoading(false);
      return;
    }
    
    const sid = clusterRes.data.session_id;
    setAutoSessionId(sid);
    
    // 3. Fetch preview
    const previewRes = await apiClient<{suggested_assignments: Record<string, number>}>(`/admin/compatibility/sessions/${sid}/preview`);
    if (previewRes.success && previewRes.data) {
      setAutoPreview(previewRes.data.suggested_assignments);
    } else {
      alert("Failed to get preview: " + previewRes.error);
    }
    
    const sessionDataRes = await apiClient<any>(`/admin/compatibility/sessions/${sid}`);
    if (sessionDataRes.success && sessionDataRes.data) {
      setAutoSessionData(sessionDataRes.data);
    }
    
    setAutoLoading(false);
  };

  const handleRemoveStudentFromCluster = async (studentId: number) => {
    if (!autoSessionId) return;
    
    setAutoLoading(true);
    const res = await apiClient<any>(`/admin/compatibility/sessions/${autoSessionId}/students/${studentId}`, {
      method: "DELETE"
    });
    
    if (res.success) {
      const previewRes = await apiClient<{suggested_assignments: Record<string, number>}>(`/admin/compatibility/sessions/${autoSessionId}/preview`);
      if (previewRes.success && previewRes.data) setAutoPreview(previewRes.data.suggested_assignments);
      
      const sessionDataRes = await apiClient<any>(`/admin/compatibility/sessions/${autoSessionId}`);
      if (sessionDataRes.success && sessionDataRes.data) setAutoSessionData(sessionDataRes.data);
      
      setStudentToRemove(null);
    } else {
      alert("Failed to remove student: " + res.error);
    }
    setAutoLoading(false);
  };

  const handleConfirmAutoAssign = async () => {
    if (!autoSessionId || !autoPreview) return;
    setAutoLoading(true);
    
    const res = await apiClient<{allocations_created: number}>(`/admin/compatibility/sessions/${autoSessionId}/auto-assign`, {
      method: "POST",
      body: JSON.stringify({
        room_assignments: autoPreview,
        plan: plan
      })
    });
    
    if (res.success) {
      alert(`Success! Created ${res.data?.allocations_created} allocations.`);
      setShowAutoAssign(false);
      setAutoSessionId(null);
      setAutoPreview(null);
      fetchAllocations();
    } else {
      alert(res.error || "Failed to commit allocations.");
    }
    setAutoLoading(false);
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
              {t("admin.allocationsTitle")}
            </h1>
            <p className="text-sm text-on-surface-variant">
              {t("admin.allocationsSubtitle")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => { setShowAutoAssign(!showAutoAssign); setShowManualForm(false); }}
            className="bg-secondary-container text-on-secondary-container px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center gap-2 shadow-soft"
          >
            <span className="material-symbols-outlined">auto_awesome</span>
            {showAutoAssign ? t("admin.cancelAi") : t("admin.aiAutoAssign")}
          </button>
          <button 
            onClick={() => { setShowManualForm(!showManualForm); setShowAutoAssign(false); }}
            className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center gap-2 shadow-soft"
          >
            <span className="material-symbols-outlined">add_task</span>
            {showManualForm ? t("admin.cancelAssignment") : t("admin.manualAssign")}
          </button>
        </div>
      </div>

      {showAutoAssign && (
        <div className="bg-gradient-to-br from-secondary-container/30 to-white rounded-2xl shadow-soft p-6 border-l-4 border-secondary-container">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-secondary text-2xl">group_work</span>
            <h3 className="text-lg font-bold text-on-surface">AI Roommate Auto-Assign</h3>
          </div>
          <p className="text-sm text-on-surface-variant mb-6">Automatically cluster compatible students based on their questionnaire responses and assign them to available rooms in the target dorm.</p>
          
          <div className="flex flex-wrap items-end gap-4 mb-6">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">{t("admin.targetDorm")}</label>
              <select 
                value={autoDormId}
                onChange={e => setAutoDormId(e.target.value)}
                className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-4 py-2 text-sm focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
              >
                <option value="">{t("admin.selectTargetDorm")}</option>
                {buildings.map(b => (
                  <option key={b.dorm_id} value={b.dorm_id}>{b.building_name}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">{t("admin.mealPlanDefault")}</label>
              <select 
                value={plan}
                onChange={e => setPlan(e.target.value)}
                className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-4 py-2 text-sm focus:border-secondary outline-none"
              >
                <option value="standard">{t("admin.standard")}</option>
                <option value="full_board">{t("admin.fullBoard")}</option>
              </select>
            </div>
            <button 
              type="button"
              disabled={autoLoading || !autoDormId}
              onClick={handleGenerateClusters}
              className="bg-secondary text-white px-6 py-2 h-[42px] rounded-xl font-bold transition-all hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
            >
              {autoLoading && !autoPreview ? <span className="material-symbols-outlined animate-spin text-sm">refresh</span> : null}
              {t("admin.generateClusters")}
            </button>
          </div>

          {autoPreview && (
            <div className="mt-6 border-t border-outline-variant pt-6">
              <h4 className="font-bold text-on-surface mb-4">{t("admin.previewAssignments")}</h4>
              <div className="bg-surface-container-lowest rounded-xl p-4 max-h-60 overflow-y-auto border border-outline-variant mb-4">
                {(!autoSessionData || !autoSessionData.clusters || autoSessionData.clusters.length === 0) ? (
                  <p className="text-sm text-on-surface-variant">{t("admin.noCompatible")}</p>
                ) : (
                  <div className="bg-white rounded-xl border border-outline-variant/30 overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                      <thead className="bg-surface-container-lowest border-b-2 border-outline-variant/30">
                        <tr>
                          <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-on-surface-variant">Cluster</th>
                          <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-on-surface-variant">Size</th>
                          <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-on-surface-variant">Assigned Room</th>
                          <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-on-surface-variant text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/20">
                        {autoSessionData.clusters.map((clusterData: any) => {
                          const clusterLabel = clusterData.cluster_label.toString();
                          const rId = autoPreview ? autoPreview[clusterLabel] : null;
                          const roomName = rId ? (rooms.find(r => r.room_id === rId)?.room_number || `Room ID ${rId}`) : "Not Assigned";
                          const isExpanded = expandedCluster === clusterLabel;
                          
                          return (
                            <React.Fragment key={clusterLabel}>
                              <tr className="hover:bg-surface-container-lowest/50 cursor-pointer" onClick={() => setExpandedCluster(isExpanded ? null : clusterLabel)}>
                                <td className="px-6 py-4 font-bold text-on-surface">
                                  <div className="flex items-center gap-2">
                                    <span className={`w-2.5 h-2.5 rounded-full shadow-sm ${rId ? 'bg-emerald-500' : 'bg-outline-variant'}`}></span>
                                    {t("admin.cluster")} {clusterLabel}
                                  </div>
                                </td>
                                <td className="px-6 py-4 font-semibold text-on-surface">{clusterData.size}</td>
                                <td className="px-6 py-4">
                                  {rId ? (
                                    <span className="bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{roomName}</span>
                                  ) : (
                                    <span className="bg-surface-container-high text-outline px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{roomName}</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-right flex items-center justify-end gap-3">
                                  <button onClick={(e) => { e.stopPropagation(); setExpandedCluster(isExpanded ? null : clusterLabel); }} className="text-xs font-bold text-on-surface-variant hover:text-primary flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[16px]">{isExpanded ? "expand_less" : "expand_more"}</span>
                                    Students
                                  </button>
                                </td>
                              </tr>
                              {isExpanded && clusterData.students && (
                                <tr>
                                  <td colSpan={4} className="px-6 py-4 bg-surface-container-lowest border-b border-outline-variant/20">
                                    <div className="text-sm font-bold text-on-surface mb-3">Students in Cluster {clusterLabel}:</div>
                                    {clusterData.students.length > 0 ? (
                                      <div className="flex flex-col gap-2">
                                        {clusterData.students.map((st: any) => (
                                          <div key={st.student_id} className="w-full bg-white border border-outline-variant/30 px-4 py-3 rounded-xl flex items-center gap-4 hover:bg-surface-container-high hover:border-primary/50 transition-all shadow-sm">
                                            <div 
                                              className="flex items-center gap-4 cursor-pointer group flex-1"
                                              onClick={() => router.push(`/admin/students?id=${st.student_id}`)}
                                            >
                                              <div className="w-10 h-10 rounded-full bg-surface-container-high border border-outline-variant/30 flex items-center justify-center overflow-hidden shrink-0">
                                                {st.profile_picture_url ? (
                                                  <img src={st.profile_picture_url} alt="Profile" className="w-full h-full object-cover" />
                                                ) : (
                                                  <span className="material-symbols-outlined text-outline-variant text-[20px]">person</span>
                                                )}
                                              </div>
                                              <div className="flex-1 min-w-0 flex flex-col items-start">
                                                <div className="font-bold text-on-surface group-hover:text-primary transition-colors truncate w-full text-left">{st.name}</div>
                                                <div className="text-xs text-on-surface-variant">ID: {st.student_id}</div>
                                              </div>
                                            </div>
                                            <button
                                              onClick={(e) => { e.stopPropagation(); setStudentToRemove(st.student_id); }}
                                              className="text-error bg-error/5 hover:bg-error/10 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                                            >
                                              <span className="material-symbols-outlined text-[14px]">person_remove</span>
                                              Remove
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="text-sm text-on-surface-variant font-medium p-4 bg-white rounded-xl border border-outline-variant/30 text-center">
                                        No students in this cluster.
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <button 
                type="button"
                onClick={handleConfirmAutoAssign}
                disabled={autoLoading || Object.keys(autoPreview).length === 0}
                className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {autoLoading ? <span className="material-symbols-outlined animate-spin text-sm">refresh</span> : <span className="material-symbols-outlined text-sm">check_circle</span>}
                {t("admin.confirmAllocate")}
              </button>
            </div>
          )}
        </div>
      )}

      {showManualForm && (
        <div className="bg-white rounded-2xl shadow-soft p-6 border-l-4 border-primary">
          <h3 className="text-lg font-bold text-on-surface mb-4">{t("admin.manualRoomAssign")}</h3>
          <form onSubmit={handleManualAssign} className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">{t("admin.appIdLabel")}</label>
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
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">{t("admin.roomLabel")}</label>
              <select 
                required
                value={roomId}
                onChange={e => setRoomId(e.target.value)}
                className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-4 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="">{t("admin.selectRoom")}</option>
                {rooms
                  .filter(room => {
                    if (room.available_beds <= 0) return false;
                    if (selectedAppDormId !== null && room.dorm_id !== selectedAppDormId) return false;
                    return true;
                  })
                  .map(room => {
                    const b = buildings.find(b => b.dorm_id === room.dorm_id);
                    return (
                      <option key={room.room_id} value={room.room_id}>
                        {b ? b.building_name : "Building"} - Room {room.room_number} ({room.available_beds} beds available)
                      </option>
                    );
                })}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">{t("admin.mealPlan")}</label>
              <select 
                value={plan}
                onChange={e => setPlan(e.target.value)}
                className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-4 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="full_board">{t("admin.fullBoard")}</option>
                <option value="breakfast">{t("admin.breakfastOnly")}</option>
              </select>
            </div>
            <button 
              type="submit" 
              disabled={actionLoading}
              className="bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-emerald-600 transition-colors disabled:opacity-50"
            >
              {actionLoading ? t("admin.assigning") : t("admin.assignRoom")}
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
          <h3 className="text-xl font-bold text-on-surface mb-2 font-headline">{t("admin.noAllocations")}</h3>
          <p className="text-on-surface-variant">{t("admin.noActiveAssign")}</p>
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
                          <div className="font-bold text-on-surface">
                            {alloc.building_name ? `${alloc.building_name} - ` : ""}Room {alloc.room_number}
                          </div>
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

      {studentToRemove !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center">
            <div className="w-16 h-16 bg-error-container text-on-error-container rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-3xl">person_remove</span>
            </div>
            <h3 className="text-xl font-bold mb-2 text-on-surface">Remove Student?</h3>
            <p className="text-sm text-on-surface-variant mb-8">
              Are you sure you want to remove this student from the cluster? They will not be automatically assigned a room.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setStudentToRemove(null)}
                className="flex-1 py-3 rounded-xl font-bold bg-surface-variant text-on-surface hover:bg-surface-container-highest transition-colors"
                disabled={autoLoading}
              >
                Cancel
              </button>
              <button 
                onClick={() => handleRemoveStudentFromCluster(studentToRemove)}
                className="flex-1 py-3 rounded-xl font-bold bg-error text-white hover:bg-error/90 transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                disabled={autoLoading}
              >
                {autoLoading ? <span className="material-symbols-outlined animate-spin text-sm">refresh</span> : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
