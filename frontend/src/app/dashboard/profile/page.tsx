"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { DashboardNavbar } from "@/components/dashboard/DashboardNavbar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { useTranslation } from "@/i18n/useTranslation";
import { apiClient, apiUploadFile } from "@/services/api";
import { AllocationInfoTab } from "@/components/dashboard/AllocationInfoTab";
import { ProfileLogTab } from "@/components/dashboard/ProfileLogTab";

export default function ProfilePage() {
  const router = useRouter();
  const { t } = useTranslation();
  
  const [isMounted, setIsMounted] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"personal" | "allocation" | "log">("personal");
  
  const [name, setName] = useState("");
  const [facultyId, setFacultyId] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [enrollStatus, setEnrollStatus] = useState<boolean | null>(null);
  const [homeCity, setHomeCity] = useState("");
  const [preferences, setPreferences] = useState("");
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [nationalityId, setNationalityId] = useState("");
  const [faculty, setFaculty] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProfile = async (id: string) => {
    const res = await apiClient<any>(`/students/${id}`);
    if (res.success && res.data) {
      setName(res.data.name || "");
      setFacultyId(res.data.faculty_id || "");
      setEmail(res.data.email || "");
      setGender(res.data.gender || "");
      setEnrollStatus(res.data.enroll_status);
      setHomeCity(res.data.home_city || "");
      setPreferences(res.data.preferences || "");
      setProfilePictureUrl(res.data.profile_picture_url || null);
      setNationalityId(res.data.nationality_id || "");
      setFaculty(res.data.faculty || "");
      if (res.data.name) localStorage.setItem("user_name", res.data.name);
      if (res.data.profile_picture_url) localStorage.setItem("user_avatar", res.data.profile_picture_url);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("user_role");
    const storedUserId = localStorage.getItem("user_id");
    
    if (!token) {
      router.push("/auth");
    } else if (role === "admin") {
      router.push("/admin");
    } else if (storedUserId) {
      setUserId(storedUserId);
      fetchProfile(storedUserId);
    }
  }, [router]);

  if (!isMounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setIsSubmitting(true);
    setApiError(null);
    setSuccessMessage(null);

    // Only sending preferences since other fields are read-only
    const payload = {
      preferences: preferences.trim() || undefined,
    };

    const res = await apiClient<any>(`/students/${userId}/profile`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });

    if (res.success && res.data) {
      setSuccessMessage(t("profile.successMessage") || "Profile updated successfully!");
    } else {
      setApiError(res.error || t("profile.updateError") || "Error updating profile.");
    }

    setIsSubmitting(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !userId) return;
    
    const file = e.target.files[0];
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setApiError("Only JPG, PNG, and WebP images are allowed.");
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setApiError("Image size must be less than 5MB.");
      return;
    }

    setIsUploading(true);
    setApiError(null);
    setSuccessMessage(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await apiUploadFile<any>(`/students/${userId}/profile-picture`, formData);
      if (res.success && res.data) {
        setProfilePictureUrl(res.data.profile_picture_url);
        localStorage.setItem("user_avatar", res.data.profile_picture_url);
        setSuccessMessage("Profile picture updated successfully!");
      } else {
        setApiError(res.error || "Failed to upload image.");
      }
    } catch (err) {
      setApiError("Network error while uploading image.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      <DashboardNavbar />
      <DashboardSidebar />
      
      <main className="lg:ml-64 pt-24 pb-12 px-8 flex-grow">
        <div className="max-w-3xl mx-auto space-y-8">
          
          <div className="flex items-center gap-6 mb-8">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-primary-container text-white flex items-center justify-center overflow-hidden border-4 border-surface shadow-md">
                {profilePictureUrl ? (
                  <img src={profilePictureUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-4xl">person</span>
                )}
              </div>
            </div>

            <div>
              <h1 className="text-3xl font-black tracking-tight text-primary font-headline">
                {name || t("profile.title") || "My Profile"}
              </h1>
              <div className="flex items-center gap-2 mt-2">
                {enrollStatus === true ? (
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">verified</span> Verified Student
                  </span>
                ) : enrollStatus === false ? (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">pending</span> Pending Verification
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="flex border-b border-outline-variant/50 mb-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab("personal")}
              className={`px-6 py-4 font-bold text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === "personal" ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/30"}`}
            >
              Personal Info
            </button>
            <button
              onClick={() => setActiveTab("allocation")}
              className={`px-6 py-4 font-bold text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === "allocation" ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/30"}`}
            >
              Allocation Info
            </button>
            <button
              onClick={() => setActiveTab("log")}
              className={`px-6 py-4 font-bold text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === "log" ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/30"}`}
            >
              Student Log
            </button>
          </div>

          {activeTab === "personal" && (
            <div className="bg-white shadow-soft rounded-2xl p-8 border border-transparent">
            {apiError && (
              <div className="mb-6 p-4 rounded-lg bg-error-container text-on-error-container text-sm font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">error</span>
                {apiError}
              </div>
            )}
            
            {successMessage && (
              <div className="mb-6 p-4 rounded-lg bg-emerald-50 text-emerald-800 text-sm font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">check_circle</span>
                {successMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Read-Only Fields */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-on-surface">Full Name</label>
                  <div className="bg-surface-variant/30 border-2 border-outline-variant/50 rounded-xl py-3 px-4 text-on-surface flex items-center gap-3">
                    <span className="material-symbols-outlined text-outline">person</span>
                    <span className="font-medium">{name || "-"}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-on-surface">Faculty ID</label>
                  <div className="bg-surface-variant/30 border-2 border-outline-variant/50 rounded-xl py-3 px-4 text-on-surface flex items-center gap-3">
                    <span className="material-symbols-outlined text-outline">badge</span>
                    <span className="font-medium">{facultyId || "-"}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-on-surface">Email Address</label>
                  <div className="bg-surface-variant/30 border-2 border-outline-variant/50 rounded-xl py-3 px-4 text-on-surface flex items-center gap-3">
                    <span className="material-symbols-outlined text-outline">email</span>
                    <span className="font-medium">{email || "-"}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-on-surface">Gender</label>
                  <div className="bg-surface-variant/30 border-2 border-outline-variant/50 rounded-xl py-3 px-4 text-on-surface flex items-center gap-3">
                    <span className="material-symbols-outlined text-outline">wc</span>
                    <span className="font-medium">{gender === "M" ? "Male" : gender === "F" ? "Female" : gender || "-"}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-on-surface">Home City</label>
                  <div className="bg-surface-variant/30 border-2 border-outline-variant/50 rounded-xl py-3 px-4 text-on-surface flex items-center gap-3">
                    <span className="material-symbols-outlined text-outline">location_city</span>
                    <span className="font-medium">{homeCity || "-"}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-on-surface">Nationality ID</label>
                  <div className="bg-surface-variant/30 border-2 border-outline-variant/50 rounded-xl py-3 px-4 text-on-surface flex items-center gap-3">
                    <span className="material-symbols-outlined text-outline">pin</span>
                    <span className="font-medium">{nationalityId || "-"}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-on-surface">Faculty</label>
                  <div className="bg-surface-variant/30 border-2 border-outline-variant/50 rounded-xl py-3 px-4 text-on-surface flex items-center gap-3">
                    <span className="material-symbols-outlined text-outline">school</span>
                    <span className="font-medium">{faculty || "-"}</span>
                  </div>
                </div>
              </div>

              {/* Editable Preferences Field */}
              <div className="space-y-2 pt-4 border-t border-outline-variant/30">
                <label htmlFor="preferences" className="block text-sm font-bold text-on-surface">
                  {t("profile.preferencesLabel") || "Housing & Roommate Preferences"}
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-4 text-outline">
                    tune
                  </span>
                  <textarea
                    id="preferences"
                    value={preferences}
                    onChange={(e) => setPreferences(e.target.value)}
                    placeholder={t("profile.preferencesPlaceholder") || "Enter your study habits, sleep schedule, etc."}
                    rows={4}
                    className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl py-3 pl-12 pr-4 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                  />
                </div>
                <p className="text-xs text-on-surface-variant mt-1">
                  These preferences are used by our AI matching system to suggest roommates.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary text-white rounded-xl py-4 font-bold tracking-wide hover:opacity-90 transition-opacity disabled:opacity-70 flex justify-center items-center gap-2 mt-8"
              >
                {isSubmitting ? (
                  <span className="material-symbols-outlined animate-spin">refresh</span>
                ) : (
                  <span className="material-symbols-outlined">save</span>
                )}
                {t("profile.submitButton") || "Save Preferences"}
              </button>
            </form>
          </div>
          )}

          {activeTab === "allocation" && userId && (
            <AllocationInfoTab userId={userId} enrollStatus={enrollStatus || false} />
          )}

          {activeTab === "log" && userId && (
            <ProfileLogTab studentId={userId} />
          )}
          
        </div>
      </main>
    </div>
  );
}
