"use client";

import React, { useState, useEffect } from "react";
import { apiClient } from "@/services/api";
import Link from "next/link";
import { useTranslation } from "@/i18n/useTranslation";

interface AllocationResponse {
  allocation: {
    allocation_id: number;
    room_id: number;
    plan: string;
    status: string;
    assigned_at: string;
    room_number: string | null;
    building_name: string | null;
    dorm_id: number | null;
  } | null;
}

interface AllocationInfoTabProps {
  userId: string;
  enrollStatus: boolean;
}

export const AllocationInfoTab: React.FC<AllocationInfoTabProps> = ({ userId, enrollStatus }) => {
  const { t } = useTranslation();
  const [allocation, setAllocation] = useState<AllocationResponse["allocation"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasPendingDoc, setHasPendingDoc] = useState(false);

  useEffect(() => {
    fetchAllocation();
  }, []);

  const fetchAllocation = async () => {
    setLoading(true);
    const res = await apiClient<AllocationResponse>(`/students/${userId}/allocation`);
    if (res.success && res.data) {
      setAllocation(res.data.allocation);
    }
    
    if (!enrollStatus) {
      const docRes = await apiClient<any>(`/students/${userId}/documents`);
      if (docRes.success && docRes.data && docRes.data.documents) {
        setHasPendingDoc(docRes.data.documents.some((d: any) => d.status === "pending"));
      }
    }
    
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <span className="material-symbols-outlined text-primary text-4xl animate-spin">refresh</span>
      </div>
    );
  }

  if (allocation) {
    return (
      <div className="bg-surface rounded-2xl p-6 shadow-sm border border-outline-variant space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary-container text-primary flex items-center justify-center">
            <span className="material-symbols-outlined">key</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-on-surface">Your Housing Allocation</h3>
            <p className="text-sm text-on-surface-variant">Assigned on {new Date(allocation.assigned_at).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/50">
            <div className="text-xs font-bold uppercase tracking-widest text-outline-variant mb-1">Building</div>
            <div className="text-lg font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">apartment</span>
              {allocation.building_name || "N/A"}
            </div>
          </div>
          <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/50">
            <div className="text-xs font-bold uppercase tracking-widest text-outline-variant mb-1">Room Number</div>
            <div className="text-lg font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">meeting_room</span>
              {allocation.room_number || "N/A"}
            </div>
          </div>
          <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/50">
            <div className="text-xs font-bold uppercase tracking-widest text-outline-variant mb-1">Meal Plan</div>
            <div className="text-lg font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">restaurant</span>
              {allocation.plan === "full_board" ? "Full Board" : "Breakfast Only"}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (enrollStatus) {
    return (
      <div className="bg-surface rounded-2xl p-8 shadow-sm border border-outline-variant text-center space-y-4">
        <span className="material-symbols-outlined text-6xl text-primary/50">home_work</span>
        <h3 className="text-xl font-bold text-on-surface">No Allocation Found</h3>
        <p className="text-on-surface-variant max-w-md mx-auto">
          Your account is verified, but you have not been allocated a room yet. Please submit a housing application.
        </p>
        <Link href="/dashboard/apply" className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-xl font-bold hover:bg-primary/90 transition-colors mt-4">
          <span className="material-symbols-outlined text-sm">post_add</span>
          Apply for Housing
        </Link>
      </div>
    );
  }

  if (hasPendingDoc) {
    return (
      <div className="bg-surface rounded-2xl p-8 shadow-sm border border-outline-variant text-center space-y-4">
        <span className="material-symbols-outlined text-6xl text-primary/50">hourglass_top</span>
        <h3 className="text-xl font-bold text-on-surface">Documents Under Review</h3>
        <p className="text-on-surface-variant max-w-md mx-auto">
          We have received your verification documents and they are currently under review by our admin team. You will be able to apply for housing once verified.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-2xl p-8 shadow-sm border border-outline-variant text-center space-y-4">
      <span className="material-symbols-outlined text-6xl text-error/50">gpp_maybe</span>
      <h3 className="text-xl font-bold text-on-surface">Account Not Verified</h3>
      <p className="text-on-surface-variant max-w-md mx-auto">
        You must verify your account with supporting documents before you can apply for housing or receive an allocation.
      </p>
      <Link href="/dashboard" className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-xl font-bold hover:bg-primary/90 transition-colors mt-4">
        <span className="material-symbols-outlined text-sm">upload_file</span>
        Upload Verification Documents
      </Link>
    </div>
  );
};
