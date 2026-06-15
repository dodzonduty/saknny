"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/i18n/useTranslation";
import { apiClient } from "@/services/api";
interface Building { dorm_id: number; building_name: string; gender_type: string; status: string; }
interface Room {
  room_id: number;
  dorm_id: number;
  room_number: string;
  total_beds: number;
  available_beds: number;
  status: string;
  latitude?: number | null;
  longitude?: number | null;
  allowed_radius_meters?: number;
}
export default function AdminCatalogPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [isMounted, setIsMounted] = useState(false);
  const [tab, setTab] = useState<"buildings"|"rooms">("buildings");
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bLoad, setBLoad] = useState(true);
  const [rLoad, setRLoad] = useState(true);
  const [showBF, setShowBF] = useState(false);
  const [bName, setBName] = useState(""); const [bGender, setBGender] = useState("M"); const [bStatus, setBStatus] = useState("active");
  const [bSub, setBSub] = useState(false); const [editBId, setEditBId] = useState<number|null>(null);
  const [showRF, setShowRF] = useState(false);
  const [rDorm, setRDorm] = useState(""); const [rNum, setRNum] = useState(""); const [rTotal, setRTotal] = useState(""); const [rAvail, setRAvail] = useState(""); const [rPref, setRPref] = useState(""); const [rStat, setRStat] = useState("active");
  const [rLat, setRLat] = useState(""); const [rLon, setRLon] = useState(""); const [rRadius, setRRadius] = useState("100");
  const [rSub, setRSub] = useState(false); const [editRId, setEditRId] = useState<number|null>(null);
  useEffect(() => { setIsMounted(true); const tk = localStorage.getItem("access_token"); const rl = localStorage.getItem("user_role"); if (!tk) router.push("/auth"); else if (rl!=="admin") router.push("/dashboard"); else { fetchB(); fetchR(); } }, [router]);
  const fetchB = async () => { setBLoad(true); const r = await apiClient<{items:Building[]}>("/catalog/buildings"); if (r.success&&r.data) setBuildings(r.data.items); setBLoad(false); };
  const fetchR = async () => { setRLoad(true); const r = await apiClient<{items:Room[]}>("/catalog/rooms"); if (r.success&&r.data) setRooms(r.data.items); setRLoad(false); };
  const submitB = async (e: React.FormEvent) => { e.preventDefault(); setBSub(true); const p = {building_name:bName,gender_type:bGender,status:bStatus}; const r = editBId ? await apiClient<any>(`/admin/catalog/buildings/${editBId}`,{method:"PUT",body:JSON.stringify(p)}) : await apiClient<any>("/admin/catalog/buildings",{method:"POST",body:JSON.stringify(p)}); if(r.success){resetBF();fetchB();}else alert(r.error||"Failed"); setBSub(false);};
  const startEB = (b:Building) => { setEditBId(b.dorm_id);setBName(b.building_name);setBGender(b.gender_type);setBStatus(b.status);setShowBF(true);};
  const resetBF = () => { setEditBId(null);setBName("");setBGender("M");setBStatus("active");setShowBF(false);};
  const submitR = async (e: React.FormEvent) => {
    e.preventDefault();
    setRSub(true);
    const p: Record<string, unknown> = {
      room_number: rNum,
      total_beds: parseInt(rTotal),
      available_beds: parseInt(rAvail),
      status: rStat,
      allowed_radius_meters: parseInt(rRadius) || 100,
    };
    if (rPref) p.dominant_preferences = rPref;
    if (rLat.trim()) p.latitude = parseFloat(rLat);
    if (rLon.trim()) p.longitude = parseFloat(rLon);
    let r: any;
    if (editRId) {
      r = await apiClient<any>(`/admin/catalog/rooms/${editRId}`, { method: "PUT", body: JSON.stringify(p) });
    } else {
      p.dorm_id = parseInt(rDorm);
      r = await apiClient<any>("/admin/catalog/rooms", { method: "POST", body: JSON.stringify(p) });
    }
    if (r.success) { resetRF(); fetchR(); } else alert(r.error || "Failed");
    setRSub(false);
  };
  const startER = (r: Room) => {
    setEditRId(r.room_id);
    setRDorm(String(r.dorm_id));
    setRNum(r.room_number);
    setRTotal(String(r.total_beds));
    setRAvail(String(r.available_beds));
    setRStat(r.status);
    setRLat(r.latitude != null ? String(r.latitude) : "");
    setRLon(r.longitude != null ? String(r.longitude) : "");
    setRRadius(String(r.allowed_radius_meters ?? 100));
    setShowRF(true);
  };
  const resetRF = () => {
    setEditRId(null);
    setRDorm("");
    setRNum("");
    setRTotal("");
    setRAvail("");
    setRPref("");
    setRStat("active");
    setRLat("");
    setRLon("");
    setRRadius("100");
    setShowRF(false);
  };
  const geofenceLabel = (r: Room) =>
    r.latitude != null && r.longitude != null
      ? `${r.latitude.toFixed(4)}, ${r.longitude.toFixed(4)} (${r.allowed_radius_meters ?? 100}m)`
      : "Not set";
  if (!isMounted) return null;
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-4"><div className="w-12 h-12 rounded-full bg-primary-container text-white flex items-center justify-center shadow-soft"><span className="material-symbols-outlined text-2xl">apartment</span></div><div><h1 className="text-3xl font-black tracking-tight text-primary font-headline">{t("admin.catalogTitle")}</h1><p className="text-sm text-on-surface-variant">{t("admin.catalogSubtitle")}</p></div></div>
      <div className="bg-white rounded-xl shadow-soft p-1 flex gap-1"><button onClick={()=>setTab("buildings")} className={`flex-1 py-3 rounded-lg font-bold text-sm ${tab==="buildings"?"bg-primary text-white":"text-on-surface-variant hover:bg-surface-container-low"}`}>{t("admin.buildingsTab")}</button><button onClick={()=>setTab("rooms")} className={`flex-1 py-3 rounded-lg font-bold text-sm ${tab==="rooms"?"bg-primary text-white":"text-on-surface-variant hover:bg-surface-container-low"}`}>{t("admin.roomsTab")}</button></div>
      {tab==="buildings"&&(<>
        <div className="flex justify-end"><button onClick={()=>{resetBF();setShowBF(!showBF);}} className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold hover:opacity-90 flex items-center gap-2 shadow-soft text-sm"><span className="material-symbols-outlined text-[18px]">{showBF?"close":"add"}</span>{showBF?"Cancel":t("admin.addBuilding")}</button></div>
        {showBF&&(<div className="bg-white rounded-2xl shadow-soft p-6 border-l-4 border-primary"><h3 className="text-lg font-bold text-on-surface mb-4">{editBId?t("admin.editBuilding"):t("admin.newBuilding")}</h3><form onSubmit={submitB} className="flex flex-wrap gap-4 items-end"><div className="flex-1 min-w-[200px]"><label className="block text-xs font-bold uppercase tracking-widest text-outline-variant mb-1">{t("admin.nameCol")}</label><input required value={bName} onChange={e=>setBName(e.target.value)} className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"/></div><div className="w-32"><label className="block text-xs font-bold uppercase tracking-widest text-outline-variant mb-1">{t("admin.genderCol")}</label><select value={bGender} onChange={e=>setBGender(e.target.value)} className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"><option value="M">{t("admin.male")}</option><option value="F">{t("admin.female")}</option></select></div><div className="w-40"><label className="block text-xs font-bold uppercase tracking-widest text-outline-variant mb-1">{t("admin.statusCol")}</label><select value={bStatus} onChange={e=>setBStatus(e.target.value)} className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"><option value="active">{t("admin.active")}</option><option value="maintenance">{t("admin.maintenance")}</option><option value="inactive">{t("admin.inactive")}</option></select></div><button type="submit" disabled={bSub} className="bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-600 disabled:opacity-50">{bSub?"...":editBId?"Update":"Create"}</button></form></div>)}
        {bLoad?<div className="py-8 flex justify-center"><span className="material-symbols-outlined text-primary text-3xl animate-spin">refresh</span></div>:(<div className="bg-white shadow-soft rounded-2xl overflow-hidden"><table className="w-full text-left"><thead className="bg-surface-container-lowest border-b-2 border-outline-variant/30"><tr><th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-on-surface-variant">{t("admin.nameCol")}</th><th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-on-surface-variant">{t("admin.genderCol")}</th><th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-on-surface-variant">{t("admin.statusCol")}</th><th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-on-surface-variant text-right">{t("admin.actionsCol")}</th></tr></thead><tbody className="divide-y divide-outline-variant/20">{buildings.map(b=>(<tr key={b.dorm_id} className="hover:bg-surface-container-lowest/50"><td className="px-6 py-4 font-semibold text-on-surface">{b.building_name}</td><td className="px-6 py-4"><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${b.gender_type==="M"?"bg-blue-50 text-blue-800":"bg-pink-50 text-pink-800"}`}>{b.gender_type}</span></td><td className="px-6 py-4"><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${b.status==="active"?"bg-emerald-50 text-emerald-800":"bg-surface-container-high text-outline"}`}>{b.status}</span></td><td className="px-6 py-4 text-right"><button onClick={()=>startEB(b)} className="text-xs font-bold text-primary hover:underline">{t("admin.editBtn")}</button></td></tr>))}</tbody></table></div>)}
      </>)}
      {tab==="rooms"&&(<>
        <div className="flex justify-end"><button onClick={()=>{resetRF();setShowRF(!showRF);}} className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold hover:opacity-90 flex items-center gap-2 shadow-soft text-sm"><span className="material-symbols-outlined text-[18px]">{showRF?"close":"add"}</span>{showRF?"Cancel":t("admin.addRoom")}</button></div>
        {showRF&&(<div className="bg-white rounded-2xl shadow-soft p-6 border-l-4 border-primary"><h3 className="text-lg font-bold text-on-surface mb-4">{editRId?t("admin.editRoom"):t("admin.newRoom")}</h3><form onSubmit={submitR} className="flex flex-wrap gap-4 items-end">{!editRId&&<div className="w-40"><label className="block text-xs font-bold uppercase tracking-widest text-outline-variant mb-1">{t("admin.buildingLabel")}</label><select required value={rDorm} onChange={e=>setRDorm(e.target.value)} className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"><option value="">Select...</option>{buildings.map(b=><option key={b.dorm_id} value={b.dorm_id}>{b.building_name}</option>)}</select></div>}<div className="w-28"><label className="block text-xs font-bold uppercase tracking-widest text-outline-variant mb-1">{t("admin.roomNumLabel")}</label><input required value={rNum} onChange={e=>setRNum(e.target.value)} className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"/></div><div className="w-28"><label className="block text-xs font-bold uppercase tracking-widest text-outline-variant mb-1">{t("admin.totalLabel")}</label><input type="number" required value={rTotal} onChange={e=>setRTotal(e.target.value)} className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"/></div><div className="w-28"><label className="block text-xs font-bold uppercase tracking-widest text-outline-variant mb-1">{t("admin.availLabel")}</label><input type="number" required value={rAvail} onChange={e=>setRAvail(e.target.value)} className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"/></div><div className="w-36"><label className="block text-xs font-bold uppercase tracking-widest text-outline-variant mb-1">{t("admin.latLabel")}</label><input type="number" step="any" value={rLat} onChange={e=>setRLat(e.target.value)} placeholder="30.123456" className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"/></div><div className="w-36"><label className="block text-xs font-bold uppercase tracking-widest text-outline-variant mb-1">{t("admin.lonLabel")}</label><input type="number" step="any" value={rLon} onChange={e=>setRLon(e.target.value)} placeholder="31.123456" className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"/></div><div className="w-28"><label className="block text-xs font-bold uppercase tracking-widest text-outline-variant mb-1">{t("admin.radiusLabel")}</label><input type="number" required min={1} value={rRadius} onChange={e=>setRRadius(e.target.value)} className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"/></div><div className="flex-1 min-w-[120px]"><label className="block text-xs font-bold uppercase tracking-widest text-outline-variant mb-1">{t("admin.prefsLabel")}</label><input value={rPref} onChange={e=>setRPref(e.target.value)} placeholder="Optional" className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"/></div><div className="w-36"><label className="block text-xs font-bold uppercase tracking-widest text-outline-variant mb-1">{t("admin.statusCol")}</label><select value={rStat} onChange={e=>setRStat(e.target.value)} className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"><option value="active">{t("admin.active")}</option><option value="maintenance">{t("admin.maintenance")}</option><option value="inactive">{t("admin.inactive")}</option></select></div><button type="submit" disabled={rSub} className="bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-600 disabled:opacity-50">{rSub?"...":editRId?"Update":"Create"}</button></form></div>)}
        {rLoad?<div className="py-8 flex justify-center"><span className="material-symbols-outlined text-primary text-3xl animate-spin">refresh</span></div>:(<div className="bg-white shadow-soft rounded-2xl overflow-hidden"><table className="w-full text-left"><thead className="bg-surface-container-lowest border-b-2 border-outline-variant/30"><tr><th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-on-surface-variant">{t("admin.buildingLabel")}</th><th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-on-surface-variant">{t("admin.roomNumLabel")}</th><th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-on-surface-variant">{t("admin.bedsCol")}</th><th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-on-surface-variant">{t("admin.geofenceCol")}</th><th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-on-surface-variant">{t("admin.statusCol")}</th><th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-on-surface-variant text-right">{t("admin.actionsCol")}</th></tr></thead><tbody className="divide-y divide-outline-variant/20">{rooms.map(r=>(<tr key={r.room_id} className="hover:bg-surface-container-lowest/50"><td className="px-6 py-4 text-on-surface-variant">{(() => { const b = buildings.find(b => b.dorm_id === r.dorm_id); return b ? <div className="font-bold text-on-surface">{b.building_name}</div> : null; })()}</td><td className="px-6 py-4 font-semibold text-on-surface">{r.room_number}</td><td className="px-6 py-4"><span className={`font-bold ${r.available_beds>2?"text-emerald-700":r.available_beds>0?"text-amber-700":"text-error"}`}>{r.available_beds}</span>/{r.total_beds}</td><td className="px-6 py-4 text-xs text-on-surface-variant max-w-[200px] truncate" title={geofenceLabel(r)}>{geofenceLabel(r)}</td><td className="px-6 py-4"><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${r.status==="active"?"bg-emerald-50 text-emerald-800":"bg-surface-container-high text-outline"}`}>{r.status}</span></td><td className="px-6 py-4 text-right"><button onClick={()=>startER(r)} className="text-xs font-bold text-primary hover:underline">{t("admin.editBtn")}</button></td></tr>))}</tbody></table></div>)}
      </>)}
    </div>
  );
}
