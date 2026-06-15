"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { DashboardNavbar } from "@/components/dashboard/DashboardNavbar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { useTranslation } from "@/i18n/useTranslation";
import { apiClient, apiUploadFile } from "@/services/api";
import { AllocationInfoTab } from "@/components/dashboard/AllocationInfoTab";
import { ProfileLogTab } from "@/components/dashboard/ProfileLogTab";
import { ElectronicCardTab } from "@/components/dashboard/ElectronicCardTab";

export default function ProfilePage() {
  const router = useRouter();
  const { t } = useTranslation();
  
  const [isMounted, setIsMounted] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"personal" | "allocation" | "log" | "electronic_card">("personal");
  
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
  
  const [docStatus, setDocStatus] = useState<string | null>(null);
  const [fieldsToEdit, setFieldsToEdit] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const frontIdRef = useRef<HTMLInputElement>(null);
  const backIdRef = useRef<HTMLInputElement>(null);

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
      fetchDocuments(storedUserId);
    }
  }, [router]);

  const fetchDocuments = async (id: string) => {
    const res = await apiClient<{documents: any[]}>(`/students/${id}/documents`);
    if (res.success && res.data && res.data.documents.length > 0) {
      const latestDoc = res.data.documents[0]; // ordered by created_at desc
      setDocStatus(latestDoc.status);
      setFieldsToEdit(latestDoc.fields_to_edit || []);
    } else {
      setDocStatus("none");
    }
  };

  const isEditable = (fieldName: string) => {
    if (docStatus === "none") return true; // Never uploaded doc
    if (docStatus === "incomplete" && fieldsToEdit.includes(fieldName)) return true;
    return false;
  };

  if (!isMounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setIsSubmitting(true);
    setApiError(null);
    setSuccessMessage(null);

    const payload: any = {
      preferences: preferences.trim() || undefined,
    };

    if (isEditable("name")) payload.name = name;
    if (isEditable("faculty_id")) payload.faculty_id = facultyId;
    if (isEditable("email")) payload.email = email;
    if (isEditable("gender")) payload.gender = gender;
    if (isEditable("home_city")) payload.home_city = homeCity;
    if (isEditable("nationality_id")) payload.nationality_id = nationalityId;
    if (isEditable("faculty")) payload.faculty = faculty;

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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "profile" | "id_front" | "id_back") => {
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

    const endpoint = type === "profile" 
      ? `/students/${userId}/profile-picture` 
      : type === "id_front" 
        ? `/students/${userId}/nationality-photo-front`
        : `/students/${userId}/nationality-photo-back`;

    try {
      const res = await apiUploadFile<any>(endpoint, formData);
      if (res.success && res.data) {
        if (type === "profile") {
          setProfilePictureUrl(res.data.profile_picture_url);
          localStorage.setItem("user_avatar", res.data.profile_picture_url);
        } else {
          // Re-fetch profile to get new ID photos
          fetchProfile(userId);
        }
        setSuccessMessage("Photo updated successfully!");
      } else {
        setApiError(res.error || "Failed to upload photo.");
      }
    } catch (err) {
      setApiError("Network error while uploading photo.");
    } finally {
      setIsUploading(false);
      if (type === "profile" && fileInputRef.current) fileInputRef.current.value = "";
      if (type === "id_front" && frontIdRef.current) frontIdRef.current.value = "";
      if (type === "id_back" && backIdRef.current) backIdRef.current.value = "";
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
              <div className="w-24 h-24 rounded-full bg-primary-container text-white flex items-center justify-center overflow-hidden border-4 border-surface shadow-md relative">
                {profilePictureUrl ? (
                  <img src={profilePictureUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-4xl">person</span>
                )}
                {isEditable("profile_picture") && (
                  <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                    <span className="material-symbols-outlined text-white">photo_camera</span>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/jpeg,image/png,image/webp" onChange={e => handlePhotoUpload(e, "profile")} disabled={isUploading} />
                  </label>
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
              className={`py-4 px-2 font-bold text-sm border-b-2 whitespace-nowrap transition-colors ${
                activeTab === "log" ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline-variant"
              }`}
            >
              Profile Log
            </button>
            <button
              onClick={() => setActiveTab("electronic_card")}
              className={`py-4 px-2 font-bold text-sm border-b-2 whitespace-nowrap transition-colors ${
                activeTab === "electronic_card" ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline-variant"
              }`}
            >
              Electronic ID
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
                
                {/* Fields */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-on-surface flex items-center gap-2">Full Name {isEditable("name") && <span className="material-symbols-outlined text-[14px] text-primary">edit</span>}</label>
                  {isEditable("name") ? (
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border-2 border-primary rounded-xl py-3 px-4 outline-none focus:ring-1 focus:ring-primary" />
                  ) : (
                    <div className="bg-surface-variant/30 border-2 border-outline-variant/50 rounded-xl py-3 px-4 text-on-surface flex items-center gap-3"><span className="material-symbols-outlined text-outline">person</span><span className="font-medium">{name || "-"}</span></div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-on-surface flex items-center gap-2">Faculty ID {isEditable("faculty_id") && <span className="material-symbols-outlined text-[14px] text-primary">edit</span>}</label>
                  {isEditable("faculty_id") ? (
                    <input type="text" value={facultyId} onChange={e => setFacultyId(e.target.value)} className="w-full border-2 border-primary rounded-xl py-3 px-4 outline-none focus:ring-1 focus:ring-primary" />
                  ) : (
                    <div className="bg-surface-variant/30 border-2 border-outline-variant/50 rounded-xl py-3 px-4 text-on-surface flex items-center gap-3"><span className="material-symbols-outlined text-outline">badge</span><span className="font-medium">{facultyId || "-"}</span></div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-on-surface flex items-center gap-2">Email Address {isEditable("email") && <span className="material-symbols-outlined text-[14px] text-primary">edit</span>}</label>
                  {isEditable("email") ? (
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border-2 border-primary rounded-xl py-3 px-4 outline-none focus:ring-1 focus:ring-primary" />
                  ) : (
                    <div className="bg-surface-variant/30 border-2 border-outline-variant/50 rounded-xl py-3 px-4 text-on-surface flex items-center gap-3"><span className="material-symbols-outlined text-outline">email</span><span className="font-medium">{email || "-"}</span></div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-on-surface flex items-center gap-2">Gender {isEditable("gender") && <span className="material-symbols-outlined text-[14px] text-primary">edit</span>}</label>
                  {isEditable("gender") ? (
                    <select value={gender} onChange={e => setGender(e.target.value)} className="w-full border-2 border-primary rounded-xl py-3 px-4 outline-none focus:ring-1 focus:ring-primary bg-white">
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                    </select>
                  ) : (
                    <div className="bg-surface-variant/30 border-2 border-outline-variant/50 rounded-xl py-3 px-4 text-on-surface flex items-center gap-3"><span className="material-symbols-outlined text-outline">wc</span><span className="font-medium">{gender === "M" ? "Male" : gender === "F" ? "Female" : gender || "-"}</span></div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-on-surface flex items-center gap-2">Home City {isEditable("home_city") && <span className="material-symbols-outlined text-[14px] text-primary">edit</span>}</label>
                  {isEditable("home_city") ? (
                    <input type="text" value={homeCity} onChange={e => setHomeCity(e.target.value)} className="w-full border-2 border-primary rounded-xl py-3 px-4 outline-none focus:ring-1 focus:ring-primary" />
                  ) : (
                    <div className="bg-surface-variant/30 border-2 border-outline-variant/50 rounded-xl py-3 px-4 text-on-surface flex items-center gap-3"><span className="material-symbols-outlined text-outline">location_city</span><span className="font-medium">{homeCity || "-"}</span></div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-on-surface flex items-center gap-2">Nationality ID {isEditable("nationality_id") && <span className="material-symbols-outlined text-[14px] text-primary">edit</span>}</label>
                  {isEditable("nationality_id") ? (
                    <input type="text" value={nationalityId} onChange={e => setNationalityId(e.target.value)} className="w-full border-2 border-primary rounded-xl py-3 px-4 outline-none focus:ring-1 focus:ring-primary" />
                  ) : (
                    <div className="bg-surface-variant/30 border-2 border-outline-variant/50 rounded-xl py-3 px-4 text-on-surface flex items-center gap-3"><span className="material-symbols-outlined text-outline">pin</span><span className="font-medium">{nationalityId || "-"}</span></div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-on-surface flex items-center gap-2">Faculty {isEditable("faculty") && <span className="material-symbols-outlined text-[14px] text-primary">edit</span>}</label>
                  {isEditable("faculty") ? (
                    <input type="text" value={faculty} onChange={e => setFaculty(e.target.value)} className="w-full border-2 border-primary rounded-xl py-3 px-4 outline-none focus:ring-1 focus:ring-primary" />
                  ) : (
                    <div className="bg-surface-variant/30 border-2 border-outline-variant/50 rounded-xl py-3 px-4 text-on-surface flex items-center gap-3"><span className="material-symbols-outlined text-outline">school</span><span className="font-medium">{faculty || "-"}</span></div>
                  )}
                </div>
              </div>
              
              {/* ID Photos - Show if editable */}
              {(isEditable("nationality_id_photo_front") || isEditable("nationality_id_photo_back")) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-outline-variant/30">
                  {isEditable("nationality_id_photo_front") && (
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-on-surface flex items-center gap-2">Nationality ID (Front) <span className="material-symbols-outlined text-[14px] text-primary">edit</span></label>
                      <label className="w-full border-2 border-dashed border-primary rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-primary/5 transition-colors">
                        <span className="material-symbols-outlined text-3xl text-primary mb-2">upload_file</span>
                        <span className="text-sm font-semibold text-primary">Upload Front Photo</span>
                        <input type="file" ref={frontIdRef} className="hidden" accept="image/jpeg,image/png,image/webp" onChange={e => handlePhotoUpload(e, "id_front")} disabled={isUploading} />
                      </label>
                    </div>
                  )}
                  {isEditable("nationality_id_photo_back") && (
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-on-surface flex items-center gap-2">Nationality ID (Back) <span className="material-symbols-outlined text-[14px] text-primary">edit</span></label>
                      <label className="w-full border-2 border-dashed border-primary rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-primary/5 transition-colors">
                        <span className="material-symbols-outlined text-3xl text-primary mb-2">upload_file</span>
                        <span className="text-sm font-semibold text-primary">Upload Back Photo</span>
                        <input type="file" ref={backIdRef} className="hidden" accept="image/jpeg,image/png,image/webp" onChange={e => handlePhotoUpload(e, "id_back")} disabled={isUploading} />
                      </label>
                    </div>
                  )}
                </div>
              )}

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

          {activeTab === "electronic_card" && userId && (
            <ElectronicCardTab 
              userId={userId} 
              name={name} 
              homeCity={homeCity} 
              faculty={faculty}
              facultyId={facultyId}
              nationalityId={nationalityId}
              profilePictureUrl={profilePictureUrl}
              enrollStatus={enrollStatus}
            />
          )}

        </div>
      </main>
    </div>
  );
}
