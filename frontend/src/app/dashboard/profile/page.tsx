"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardNavbar } from "@/components/dashboard/DashboardNavbar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { useTranslation } from "@/i18n/useTranslation";
import { apiClient } from "@/services/api";

export default function ProfilePage() {
  const router = useRouter();
  const { t } = useTranslation();
  
  const [isMounted, setIsMounted] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  const [name, setName] = useState("");
  const [homeCity, setHomeCity] = useState("");
  const [preferences, setPreferences] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchProfile = async (id: string) => {
    const res = await apiClient<any>(`/students/${id}`);
    if (res.success && res.data) {
      if (res.data.name) setName(res.data.name);
      if (res.data.home_city) setHomeCity(res.data.home_city);
      if (res.data.preferences) setPreferences(res.data.preferences);
      if (res.data.name) localStorage.setItem("user_name", res.data.name);
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

    const payload = {
      name: name.trim() || undefined,
      home_city: homeCity.trim() || undefined,
      preferences: preferences.trim() || undefined,
    };

    const res = await apiClient<any>(`/students/${userId}/profile`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });

    if (res.success && res.data) {
      setSuccessMessage(t("profile.successMessage"));
      // Update local storage just in case
      if (res.data.name) localStorage.setItem("user_name", res.data.name);
    } else {
      setApiError(res.error || t("profile.updateError"));
    }

    setIsSubmitting(false);
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      <DashboardNavbar />
      <DashboardSidebar />
      
      <main className="lg:ml-64 pt-24 pb-12 px-8 flex-grow">
        <div className="max-w-3xl mx-auto space-y-8">
          
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-full bg-primary-container text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">person</span>
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-primary font-headline">
                {t("profile.title")}
              </h1>
              <p className="text-sm text-on-surface-variant">
                {t("profile.subtitle")}
              </p>
            </div>
          </div>

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
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-bold text-on-surface">
                  {t("profile.nameLabel")}
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">
                    person
                  </span>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl py-3 pl-12 pr-4 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="homeCity" className="block text-sm font-bold text-on-surface">
                  {t("profile.homeCityLabel")}
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">
                    location_city
                  </span>
                  <input
                    id="homeCity"
                    type="text"
                    value={homeCity}
                    onChange={(e) => setHomeCity(e.target.value)}
                    className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl py-3 pl-12 pr-4 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="preferences" className="block text-sm font-bold text-on-surface">
                  {t("profile.preferencesLabel")}
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-4 text-outline">
                    tune
                  </span>
                  <textarea
                    id="preferences"
                    value={preferences}
                    onChange={(e) => setPreferences(e.target.value)}
                    placeholder={t("profile.preferencesPlaceholder")}
                    rows={4}
                    className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl py-3 pl-12 pr-4 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                  />
                </div>
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
                {t("profile.submitButton")}
              </button>
            </form>
          </div>
          
        </div>
      </main>
    </div>
  );
}
