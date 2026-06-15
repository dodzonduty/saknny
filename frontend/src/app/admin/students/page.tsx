"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/i18n/useTranslation";
import { apiClient, apiUploadFile } from "@/services/api";
import { AllocationInfoTab } from "@/components/dashboard/AllocationInfoTab";
import { ProfileLogTab } from "@/components/dashboard/ProfileLogTab";
import { ElectronicCardTab } from "@/components/dashboard/ElectronicCardTab";

export default function AdminStudentsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  
  const [isMounted, setIsMounted] = useState(false);
  
  // Search State
  const [searchStudentId, setSearchStudentId] = useState<string>("");
  const [searchStudentName, setSearchStudentName] = useState<string>("");
  const [searchResults, setSearchResults] = useState<{student_id: number; name: string}[]>([]);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Profile State
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
  const [frontPhotoUrl, setFrontPhotoUrl] = useState<string | null>(null);
  const [backPhotoUrl, setBackPhotoUrl] = useState<string | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsMounted(true);
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("user_role");
    if (!token || role !== "admin") {
      router.push("/auth");
    }
  }, [router]);

  // Autocomplete fetch effect
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchStudentName.length >= 2 && showDropdown) {
        setIsSearching(true);
        const res = await apiClient<{students: {student_id: number; name: string}[]}>(`/admin/students/search?q=${searchStudentName}`);
        if (res.success && res.data) {
          setSearchResults(res.data.students);
        } else {
          setSearchResults([]);
        }
        setIsSearching(false);
      } else if (searchStudentName.length < 2) {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchStudentName, showDropdown]);

  // When admin selects a student, fetch the profile
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchStudentId && !showDropdown) {
        fetchProfile(searchStudentId);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchStudentId, showDropdown]);

  const fetchProfile = async (id: string) => {
    setUserId(null); // reset while loading
    setApiError(null);
    setSuccessMessage(null);
    const res = await apiClient<any>(`/students/${id}`);
    if (res.success && res.data) {
      setUserId(id);
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
      setFrontPhotoUrl(res.data.nationality_id_photo_front || null);
      setBackPhotoUrl(res.data.nationality_id_photo_back || null);
      setActiveTab("personal");
    } else {
      setApiError(res.error || "Failed to fetch student profile");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setIsSubmitting(true);
    setApiError(null);
    setSuccessMessage(null);

    const payload = {
      name,
      faculty_id: facultyId,
      email,
      gender,
      home_city: homeCity,
      nationality_id: nationalityId,
      faculty,
      preferences: preferences.trim() || undefined,
    };

    const res = await apiClient<any>(`/students/${userId}/profile`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });

    if (res.success && res.data) {
      setSuccessMessage("Student profile updated successfully!");
    } else {
      setApiError(res.error || "Error updating profile.");
    }

    setIsSubmitting(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !userId) return;
    
    const file = e.target.files[0];
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setApiError("Only JPG, PNG, and WebP images are allowed.");
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
        setSuccessMessage("Profile photo updated successfully!");
      } else {
        setApiError(res.error || "Failed to upload photo.");
      }
    } catch (err) {
      setApiError("Network error while uploading photo.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (!isMounted) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      {/* Header */}
          <div className="bg-gradient-to-r from-blue-700 to-blue-900 rounded-2xl p-8 text-white shadow-soft relative overflow-hidden">
            <div className="relative z-10">
              <h1 className="text-3xl font-black tracking-tight mb-2 font-headline">
                Student Directory
              </h1>
              <p className="text-blue-100 max-w-xl">
                Search for any student to view or edit their profile, allocation, and electronic ID.
              </p>
            </div>
            <span className="material-symbols-outlined absolute -right-4 -bottom-10 text-[180px] text-white/5 pointer-events-none transform -rotate-12">
              badge
            </span>
          </div>

          {/* Search Box */}
          <div className="bg-surface rounded-2xl p-6 shadow-sm border border-outline-variant">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1">Search by Student ID</label>
                <input
                  type="number"
                  placeholder="e.g. 1001"
                  value={searchStudentId}
                  onChange={(e) => {
                    setSearchStudentId(e.target.value);
                    if (e.target.value === "") setUserId(null);
                  }}
                  className="w-full px-3 py-3 rounded-xl border-2 border-outline-variant bg-surface text-on-surface focus:ring-0 focus:border-primary outline-none transition-all"
                />
              </div>
              <div className="relative">
                <label className="block text-sm font-semibold text-on-surface mb-1">Search by Name</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-3.5 text-outline-variant">search</span>
                  <input
                    type="text"
                    placeholder="Search by name..."
                    value={searchStudentName}
                    onFocus={() => setShowDropdown(true)}
                    onChange={(e) => {
                      setSearchStudentName(e.target.value);
                      setShowDropdown(true);
                      if (searchStudentId) setSearchStudentId(""); 
                    }}
                    className="w-full pl-10 pr-3 py-3 rounded-xl border-2 border-outline-variant bg-surface text-on-surface focus:ring-0 focus:border-primary outline-none transition-all"
                  />
                </div>
                {showDropdown && (searchStudentName.length >= 2) && (
                  <div className="absolute z-50 w-full mt-1 bg-surface border-2 border-outline-variant rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {isSearching ? (
                      <div className="p-3 text-sm text-on-surface-variant text-center">Searching...</div>
                    ) : searchResults.length > 0 ? (
                      searchResults.map(s => (
                        <div 
                          key={s.student_id}
                          className="p-3 text-sm text-on-surface hover:bg-surface-container-high cursor-pointer border-b border-outline-variant/30 last:border-0"
                          onClick={() => {
                            setSearchStudentId(s.student_id.toString());
                            setSearchStudentName(s.name);
                            setShowDropdown(false);
                          }}
                        >
                          <div className="font-semibold">{s.name}</div>
                          <div className="text-xs text-on-surface-variant">ID: {s.student_id}</div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-sm text-on-surface-variant text-center">No students found</div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {searchStudentId && !userId && !apiError && (
              <div className="mt-4 flex justify-center">
                <span className="material-symbols-outlined text-primary text-2xl animate-spin">refresh</span>
              </div>
            )}
            {apiError && !userId && (
              <div className="mt-4 p-3 rounded-lg bg-error-container text-on-error-container text-sm font-semibold">
                {apiError}
              </div>
            )}
          </div>

          {/* Profile View */}
          {userId && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full bg-primary-container text-white flex items-center justify-center overflow-hidden border-4 border-surface shadow-md relative">
                    {profilePictureUrl ? (
                      <img src={profilePictureUrl} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-4xl">person</span>
                    )}
                    <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                      <span className="material-symbols-outlined text-white">photo_camera</span>
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoUpload} disabled={isUploading} />
                    </label>
                  </div>
                </div>

                <div>
                  <h2 className="text-3xl font-black tracking-tight text-primary font-headline">
                    {name || "Student Profile"}
                  </h2>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm font-semibold text-on-surface-variant">ID: {userId}</span>
                    <span className="text-outline-variant px-1">•</span>
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
              <div className="flex border-b border-outline-variant/50 overflow-x-auto">
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
                  className={`py-4 px-6 font-bold text-sm border-b-2 whitespace-nowrap transition-colors ${activeTab === "log" ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline-variant"}`}
                >
                  Profile Log
                </button>
                <button
                  onClick={() => setActiveTab("electronic_card")}
                  className={`py-4 px-6 font-bold text-sm border-b-2 whitespace-nowrap transition-colors ${activeTab === "electronic_card" ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline-variant"}`}
                >
                  Electronic ID
                </button>
              </div>

              {/* Tab Contents */}
              {activeTab === "personal" && (
                <div className="bg-surface shadow-soft rounded-2xl p-8 border border-outline-variant/30">
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
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-on-surface flex items-center gap-2">Full Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border-2 border-outline-variant rounded-xl py-3 px-4 outline-none focus:border-primary transition-colors bg-surface text-on-surface" />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-on-surface flex items-center gap-2">Faculty ID</label>
                        <input type="text" value={facultyId} onChange={e => setFacultyId(e.target.value)} className="w-full border-2 border-outline-variant rounded-xl py-3 px-4 outline-none focus:border-primary transition-colors bg-surface text-on-surface" />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-on-surface flex items-center gap-2">Email Address</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border-2 border-outline-variant rounded-xl py-3 px-4 outline-none focus:border-primary transition-colors bg-surface text-on-surface" />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-on-surface flex items-center gap-2">Gender</label>
                        <select value={gender} onChange={e => setGender(e.target.value)} className="w-full border-2 border-outline-variant rounded-xl py-3 px-4 outline-none focus:border-primary transition-colors bg-surface text-on-surface">
                          <option value="M">Male</option>
                          <option value="F">Female</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-on-surface flex items-center gap-2">Home City</label>
                        <input type="text" value={homeCity} onChange={e => setHomeCity(e.target.value)} className="w-full border-2 border-outline-variant rounded-xl py-3 px-4 outline-none focus:border-primary transition-colors bg-surface text-on-surface" />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-on-surface flex items-center gap-2">Nationality ID</label>
                        <input type="text" value={nationalityId} onChange={e => setNationalityId(e.target.value)} className="w-full border-2 border-outline-variant rounded-xl py-3 px-4 outline-none focus:border-primary transition-colors bg-surface text-on-surface" />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-on-surface flex items-center gap-2">Faculty</label>
                        <input type="text" value={faculty} onChange={e => setFaculty(e.target.value)} className="w-full border-2 border-outline-variant rounded-xl py-3 px-4 outline-none focus:border-primary transition-colors bg-surface text-on-surface" />
                      </div>
                    </div>

                    <div className="space-y-2 pt-4 border-t border-outline-variant/30">
                      <label htmlFor="preferences" className="block text-sm font-bold text-on-surface">Housing & Roommate Preferences</label>
                      <textarea
                        id="preferences"
                        value={preferences}
                        onChange={(e) => setPreferences(e.target.value)}
                        rows={4}
                        className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl py-3 px-4 text-on-surface focus:outline-none focus:border-primary transition-all resize-none"
                      />
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
                      Save Admin Overrides
                    </button>
                  </form>
                </div>
              )}

              {activeTab === "allocation" && (
                <AllocationInfoTab userId={userId} enrollStatus={enrollStatus || false} />
              )}

              {activeTab === "log" && (
                <ProfileLogTab studentId={userId} />
              )}

              {activeTab === "electronic_card" && (
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
          )}

        </div>
  );
}
