"use client";

import React, { useState, useEffect, useRef } from "react";
import { apiClient } from "@/services/api";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { useTranslation } from "@/i18n/useTranslation";

interface Allocation {
  allocation_id: number;
  room_id: number;
  plan: string;
  status: string;
  assigned_at: string;
  room_number: string | null;
  building_name: string | null;
  dorm_id: number | null;
}

interface ElectronicCardTabProps {
  userId: string;
  name: string;
  homeCity: string;
  faculty: string;
  profilePictureUrl: string | null;
  enrollStatus: boolean | null;
  facultyId?: string;
  nationalityId?: string;
}

export const ElectronicCardTab: React.FC<ElectronicCardTabProps> = ({ 
  userId, 
  name, 
  homeCity, 
  faculty, 
  profilePictureUrl,
  enrollStatus,
  facultyId,
  nationalityId
}) => {
  const { t } = useTranslation();
  const [allocation, setAllocation] = useState<Allocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAllocation();
  }, []);

  const fetchAllocation = async () => {
    setLoading(true);
    const res = await apiClient<{allocation: Allocation | null}>(`/students/${userId}/allocation`);
    if (res.success && res.data && res.data.allocation) {
      setAllocation(res.data.allocation);
    }
    setLoading(false);
  };

  const handleDownload = async () => {
    if (!cardRef.current || !allocation) return;
    
    setDownloading(true);
    try {
      // Temporarily add a white background if needed, though card has a gradient
      const dataUrl = await toPng(cardRef.current, {
        quality: 1.0,
        pixelRatio: 3,
        skipFonts: false,
      });

      // Standard ID card size: CR80 (3.375" x 2.125") -> 85.6mm x 53.98mm
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [85.6, 54]
      });

      pdf.addImage(dataUrl, "PNG", 0, 0, 85.6, 54);
      pdf.save(`Saknny_ID_${userId}.pdf`);
    } catch (error) {
      console.error("Failed to generate PDF", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <span className="material-symbols-outlined text-primary text-4xl animate-spin">refresh</span>
      </div>
    );
  }

  if (!enrollStatus || !allocation) {
    return (
      <div className="bg-surface rounded-2xl p-8 shadow-sm border border-outline-variant text-center space-y-4">
        <span className="material-symbols-outlined text-6xl text-error/50">block</span>
        <h3 className="text-xl font-bold text-on-surface">{t("dashboardAdditions.cardUnavailable")}</h3>
        <p className="text-on-surface-variant max-w-md mx-auto">
          {t("dashboardAdditions.cardUnavailableDesc")}
        </p>
      </div>
    );
  }

  // A random card number for aesthetic purposes, based on userId
  const cardNumber = `SK-${new Date().getFullYear()}-${userId.padStart(4, '0')}`;

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-primary font-headline">{t("dashboardAdditions.electronicIdCard")}</h2>
          <p className="text-sm text-on-surface-variant mt-1">{t("dashboardAdditions.electronicIdCardDesc")}</p>
        </div>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="bg-primary text-white font-bold py-2 px-6 rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <span className="material-symbols-outlined">{downloading ? 'hourglass_top' : 'download'}</span>
          {downloading ? t("dashboardAdditions.generating") : t("dashboardAdditions.downloadPdf")}
        </button>
      </div>

      <div className="flex justify-center p-8 bg-surface-container-lowest rounded-3xl border border-outline-variant/30">
        {/* Actual Card Container (Hidden overflow for crisp edges) */}
        <div 
          ref={cardRef}
          className="relative w-[400px] h-[252px] rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-between p-1 select-none"
          style={{
            background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 50%, #7dd3fc 100%)',
            fontFamily: "'Inter', sans-serif"
          }}
        >
          {/* Background Watermark/Pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center">
             <svg viewBox="0 0 100 100" className="w-64 h-64 text-primary" fill="currentColor">
               <polygon points="50,10 90,90 10,90" />
               <circle cx="50" cy="65" r="10" fill="white" />
             </svg>
          </div>

          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, #0369a1 1px, transparent 0)`,
            backgroundSize: '16px 16px'
          }}></div>

          {/* Header */}
          <div className="relative z-10 flex items-center justify-between bg-primary text-white p-3 rounded-t-xl">
            <div className="flex items-center gap-3">
              <img src="/images/logo.png" alt="University Logo" className="h-8 w-8 object-contain bg-white rounded-full p-1" />
              <div>
                <h1 className="text-sm font-black tracking-wider uppercase leading-tight">Saknny</h1>
                <p className="text-[8px] opacity-80 uppercase tracking-widest font-medium">Student Residence</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-[10px] font-bold text-blue-100 mb-0.5">بطاقة سكن (Dorm ID)</h2>
              <div className="text-[10px] font-mono bg-black/20 px-2 py-0.5 rounded backdrop-blur-sm">
                {cardNumber}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="relative z-10 flex gap-4 p-4 flex-grow">
            {/* Photo */}
            <div className="flex-shrink-0 flex flex-col gap-2">
              <div className="w-24 h-28 bg-white p-1 rounded-lg shadow-sm border border-blue-200/50">
                {profilePictureUrl ? (
                  <img src={profilePictureUrl} alt="Student" className="w-full h-full object-cover rounded bg-surface-variant" />
                ) : (
                  <div className="w-full h-full rounded bg-surface-variant flex items-center justify-center text-outline-variant">
                    <span className="material-symbols-outlined text-4xl">person</span>
                  </div>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="flex-grow flex flex-col justify-center space-y-0.5">
              
              <div className="flex flex-col">
                <span className="text-[8px] font-bold uppercase text-primary/70 tracking-wider">رقم التسجيل / Reg. Number</span>
                <span className="text-xs font-black text-on-surface font-mono">{userId.padStart(8, '0')}</span>
              </div>

              <div className="flex flex-col">
                <span className="text-[8px] font-bold uppercase text-primary/70 tracking-wider">اسم الطالب / Student Name</span>
                <span className="text-xs font-bold text-on-surface leading-tight">{name || t("dashboardAdditions.unknown")}</span>
              </div>

              <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-0.5">
                <div className="flex flex-col">
                  <span className="text-[8px] font-bold uppercase text-primary/70 tracking-wider">الكلية / Faculty</span>
                  <span className="text-[10px] font-bold text-on-surface truncate">{faculty || t("dashboardAdditions.na")}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] font-bold uppercase text-primary/70 tracking-wider">الرقم الجامعي / Faculty ID</span>
                  <span className="text-[10px] font-bold text-on-surface truncate font-mono">{facultyId || t("dashboardAdditions.na")}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] font-bold uppercase text-primary/70 tracking-wider">الرقم القومي / National ID</span>
                  <span className="text-[10px] font-bold text-on-surface truncate font-mono">{nationalityId || t("dashboardAdditions.na")}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] font-bold uppercase text-primary/70 tracking-wider">العنوان / Address</span>
                  <span className="text-[10px] font-bold text-on-surface truncate">{homeCity || t("dashboardAdditions.na")}</span>
                </div>
              </div>

            </div>
          </div>

          {/* Footer (Room & Building) */}
          <div className="relative z-10 bg-white/60 backdrop-blur-md border-t border-blue-200/50 p-2.5 rounded-b-xl flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <span className="text-[8px] font-bold uppercase text-primary tracking-wider">المبنى / Building</span>
                  <span className="text-xs font-black text-on-surface">{allocation.building_name || t("dashboardAdditions.na")}</span>
                </div>
                <div className="w-px h-6 bg-blue-200/50"></div>
                <div className="flex flex-col">
                  <span className="text-[8px] font-bold uppercase text-primary tracking-wider">رقم الغرفة / Room No.</span>
                  <span className="text-xs font-black text-on-surface">{allocation.room_number || t("dashboardAdditions.na")}</span>
                </div>
             </div>
             <div className="flex flex-col items-end">
                <span className="text-[8px] font-bold uppercase text-primary tracking-wider">Year</span>
                <span className="text-xs font-black text-on-surface">{new Date().getFullYear()}/{new Date().getFullYear()+1}</span>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};
