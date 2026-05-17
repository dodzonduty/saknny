"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardNavbar } from "@/components/dashboard/DashboardNavbar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { useTranslation } from "@/i18n/useTranslation";
import { apiClient } from "@/services/api";
import Link from "next/link";

interface Building {
  dorm_id: number;
  building_name: string;
  gender_type: string;
  status: string;
}

interface Room {
  room_id: number;
  dorm_id: number;
  room_number: string;
  total_beds: int;
  available_beds: int;
  status: string;
}

export default function CatalogPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [isMounted, setIsMounted] = useState(false);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null);
  
  const [genderFilter, setGenderFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [availableOnly, setAvailableOnly] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("user_role");
    
    if (!token) {
      router.push("/auth");
    } else if (role === "admin") {
      router.push("/admin");
    } else {
      fetchBuildings("", "");
    }
  }, [router]);

  const fetchBuildings = async (gender: string, status: string) => {
    setLoading(true);
    let url = "/catalog/buildings?";
    if (gender) url += `gender_type=${gender}&`;
    if (status) url += `status=${status}`;
    
    const res = await apiClient<{ items: Building[] }>(url);
    if (res.success && res.data) {
      setBuildings(res.data.items);
    }
    setLoading(false);
  };

  const fetchRooms = async (dormId: number, available: boolean) => {
    const res = await apiClient<{ items: Room[] }>(`/catalog/rooms?dorm_id=${dormId}&available_only=${available}`);
    if (res.success && res.data) {
      setRooms(res.data.items);
    }
  };

  useEffect(() => {
    if (isMounted) {
      fetchBuildings(genderFilter, statusFilter);
      setSelectedBuildingId(null);
      setRooms([]);
    }
  }, [genderFilter, statusFilter, isMounted]);

  useEffect(() => {
    if (selectedBuildingId) {
      fetchRooms(selectedBuildingId, availableOnly);
    }
  }, [availableOnly, selectedBuildingId]);

  if (!isMounted) return null;

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      <DashboardNavbar />
      <DashboardSidebar />
      
      <main className="lg:ml-64 pt-24 pb-12 px-8 flex-grow">
        <div className="max-w-6xl mx-auto space-y-8">
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary-container text-primary flex items-center justify-center shadow-soft">
                <span className="material-symbols-outlined text-2xl">apartment</span>
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-primary font-headline">
                  {t("catalog.title")}
                </h1>
                <p className="text-sm text-on-surface-variant">
                  {t("catalog.subtitle")}
                </p>
              </div>
            </div>
            <Link 
              href="/dashboard/apply" 
              className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center gap-2 shadow-soft"
            >
              <span className="material-symbols-outlined">assignment</span>
              {t("applications.applyNow")}
            </Link>
          </div>

          <div className="bg-white rounded-2xl shadow-soft p-4 border border-transparent flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-outline">wc</span>
              <select 
                value={genderFilter} 
                onChange={(e) => setGenderFilter(e.target.value)}
                className="bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-4 py-2 text-sm font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="">{t("catalog.genderAll")}</option>
                <option value="M">{t("catalog.genderMale")}</option>
                <option value="F">{t("catalog.genderFemale")}</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-outline">info</span>
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-4 py-2 text-sm font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="">{t("catalog.statusAll")}</option>
                <option value="active">{t("catalog.statusActive")}</option>
                <option value="maintenance">{t("catalog.statusMaintenance")}</option>
                <option value="inactive">{t("catalog.statusInactive")}</option>
              </select>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <label className="flex items-center gap-2 cursor-pointer select-none text-sm font-bold text-on-surface">
                <input 
                  type="checkbox" 
                  checked={availableOnly}
                  onChange={(e) => setAvailableOnly(e.target.checked)}
                  className="w-5 h-5 rounded border-2 border-outline-variant text-primary focus:ring-primary"
                />
                {t("catalog.availableOnly")}
              </label>
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center">
              <span className="material-symbols-outlined text-primary text-4xl animate-spin">refresh</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {buildings.map((b) => (
                <div 
                  key={b.dorm_id} 
                  onClick={() => setSelectedBuildingId(b.dorm_id)}
                  className={`bg-white rounded-2xl shadow-soft p-6 cursor-pointer border-2 transition-all duration-200 ${
                    selectedBuildingId === b.dorm_id ? "border-primary ring-4 ring-primary/10" : "border-transparent hover:border-outline-variant/30"
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-on-surface font-headline">{b.building_name}</h3>
                    <span className="material-symbols-outlined text-outline-variant text-3xl">apartment</span>
                  </div>
                  <div className="flex gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${
                      b.gender_type === 'M' ? 'bg-blue-50 text-blue-800' : 'bg-pink-50 text-pink-800'
                    }`}>
                      {b.gender_type === 'M' ? t("catalog.genderMale") : t("catalog.genderFemale")}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${
                      b.status === 'active' ? 'bg-emerald-50 text-emerald-800' : 
                      b.status === 'maintenance' ? 'bg-amber-50 text-amber-800' : 
                      'bg-error-container text-on-error-container'
                    }`}>
                      {b.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedBuildingId && (
            <div className="bg-white rounded-2xl shadow-soft p-8 border border-transparent mt-8">
              <h2 className="text-2xl font-bold text-on-surface mb-6 font-headline flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">meeting_room</span>
                {t("catalog.roomsTitle")}
              </h2>
              {rooms.length === 0 ? (
                <div className="text-center py-8 text-on-surface-variant font-medium">
                  {availableOnly ? "No available rooms in this building." : "No rooms found for this building."}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {rooms.map(room => (
                    <div key={room.room_id} className="border-2 border-outline-variant/20 rounded-xl p-4 flex flex-col justify-between hover:border-primary/30 transition-colors">
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-black text-lg text-on-surface">{t("catalog.roomNumber")} {room.room_number}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${
                          room.status === 'active' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                        }`}>
                          {room.status}
                        </span>
                      </div>
                      <div className="flex justify-between items-end">
                        <div className="text-sm text-on-surface-variant font-medium">
                          {room.total_beds} {t("catalog.beds")}
                        </div>
                        <div className={`text-sm font-bold flex items-center gap-1 ${
                          room.available_beds > 2 ? "text-emerald-600" :
                          room.available_beds > 0 ? "text-amber-600" : "text-error"
                        }`}>
                          <span className="material-symbols-outlined text-[16px]">bed</span>
                          {room.available_beds} {t("catalog.available")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
        </div>
      </main>
    </div>
  );
}
