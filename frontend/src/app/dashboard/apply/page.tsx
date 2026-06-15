"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardNavbar } from "@/components/dashboard/DashboardNavbar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { useTranslation } from "@/i18n/useTranslation";
import { apiClient } from "@/services/api";

interface Building {
  dorm_id: number;
  building_name: string;
}

export default function ApplyPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [isMounted, setIsMounted] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(true);
  const [loading, setLoading] = useState(true);
  
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedDormId, setSelectedDormId] = useState<string>("");
  const [notes, setNotes] = useState("");
  
  const [questionnaire, setQuestionnaire] = useState<any>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("user_role");
    const userId = localStorage.getItem("user_id");
    
    if (!token) {
      router.push("/auth");
    } else if (role === "admin") {
      router.push("/admin");
    } else if (userId) {
      checkStatusAndFetchBuildings(userId);
    }
  }, [router]);

  const checkStatusAndFetchBuildings = async (userId: string) => {
    setLoading(true);
    // Fetch profile to check enrollment status and gender
    const profileRes = await apiClient<any>(`/students/${userId}`);
    if (profileRes.success && profileRes.data) {
      if (profileRes.data.enroll_status !== true) {
        setIsEnrolled(false);
        setLoading(false);
        return;
      }
      
      const gender = profileRes.data.gender;
      // Fetch buildings filtered by gender
      let url = "/catalog/buildings?status=active";
      if (gender) url += `&gender_type=${gender}`;
      
      const buildRes = await apiClient<{ items: Building[] }>(url);
      if (buildRes.success && buildRes.data) {
        setBuildings(buildRes.data.items);
      }
      
      // Fetch questionnaire
      const qRes = await apiClient<any>("/compatibility/questionnaires/me");
      if (qRes.success && qRes.data?.questionnaire) {
        const q = qRes.data.questionnaire;
        setQuestionnaire(q);
        
        // Check if already answered
        const rRes = await apiClient<any>("/compatibility/responses/me");
        if (rRes.success && rRes.data?.items?.length > 0) {
          const alreadyAnswered = rRes.data.items.some((r: any) => r.questionnaire_id === q.questionnaire_id);
          setHasAnswered(alreadyAnswered);
        }
      }
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setApiError(null);

    // Submit Questionnaire first if needed
    if (questionnaire && !hasAnswered) {
      for (const q of questionnaire.questions) {
        if (!answers[q.code]) {
          setApiError(`Please answer all compatibility questions (${q.text})`);
          setIsSubmitting(false);
          return;
        }
      }
      
      const qPayload = {
        questionnaire_id: questionnaire.questionnaire_id,
        answers: answers
      };
      
      const qSubRes = await apiClient<any>("/compatibility/responses", {
        method: "POST",
        body: JSON.stringify(qPayload)
      });
      
      if (!qSubRes.success) {
        setApiError(qSubRes.error || "Failed to submit compatibility questionnaire.");
        setIsSubmitting(false);
        return;
      }
      setHasAnswered(true);
    }

    const payload = {
      preferred_dorm_id: selectedDormId ? parseInt(selectedDormId) : null,
      notes: notes.trim() || null,
    };

    const res = await apiClient<any>("/applications", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (res.success) {
      router.push("/dashboard/applications");
    } else {
      setApiError(res.error || t("apply.applyError"));
      setIsSubmitting(false);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      <DashboardNavbar />
      <DashboardSidebar />
      
      <main className="lg:ms-64 pt-24 pb-12 px-8 flex-grow">
        <div className="max-w-2xl mx-auto space-y-8">
          
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-full bg-primary-container text-white flex items-center justify-center shadow-soft">
              <span className="material-symbols-outlined text-2xl">post_add</span>
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-primary font-headline">
                {t("apply.title")}
              </h1>
              <p className="text-sm text-on-surface-variant">
                {t("apply.subtitle")}
              </p>
            </div>
          </div>

          <div className="bg-white shadow-soft rounded-2xl p-8 border border-transparent relative overflow-hidden">
            {loading ? (
              <div className="py-12 flex justify-center">
                <span className="material-symbols-outlined text-primary text-4xl animate-spin">refresh</span>
              </div>
            ) : !isEnrolled ? (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">lock</span>
                <h3 className="text-xl font-bold text-on-surface mb-2 font-headline">Action Required</h3>
                <p className="text-on-surface-variant max-w-sm mx-auto">
                  {t("apply.lockedMessage")}
                </p>
                <div className="mt-8">
                  <button onClick={() => router.push("/dashboard")} className="bg-primary text-white px-6 py-2 rounded-xl font-bold hover:opacity-90 transition-opacity">
                    Go to Dashboard
                  </button>
                </div>
              </div>
            ) : (
              <>
                {apiError && (
                  <div className="mb-6 p-4 rounded-lg bg-error-container text-on-error-container text-sm font-semibold flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">error</span>
                    {apiError}
                  </div>
                )}
                
                {questionnaire && !hasAnswered && (
                  <div className="mb-8 p-6 bg-secondary-container/20 border-2 border-secondary-container rounded-2xl">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="material-symbols-outlined text-secondary text-2xl">psychology</span>
                      <h3 className="text-xl font-bold text-on-surface">Roommate Compatibility</h3>
                    </div>
                    <p className="text-sm text-on-surface-variant mb-6">
                      Please answer these questions honestly. Your answers will be used by our AI matching system to find your ideal roommate.
                    </p>
                    
                    <div className="space-y-6">
                      {questionnaire.questions.map((q: any, i: number) => (
                        <div key={q.code} className="bg-white p-4 rounded-xl shadow-sm border border-outline-variant">
                          <p className="font-bold text-on-surface mb-3">
                            <span className="text-secondary mr-2">Q{i + 1}.</span>
                            {q.text}
                          </p>
                          <div className="space-y-2">
                            {q.choices.map((choice: any) => (
                              <label key={choice.value} className="flex items-start gap-3 cursor-pointer group">
                                <div className="mt-0.5">
                                  <input 
                                    type="radio" 
                                    name={q.code} 
                                    value={choice.value}
                                    checked={answers[q.code] === choice.value}
                                    onChange={(e) => setAnswers(prev => ({...prev, [q.code]: e.target.value}))}
                                    className="w-4 h-4 text-secondary focus:ring-secondary border-outline"
                                  />
                                </div>
                                <span className={`text-sm ${answers[q.code] === choice.value ? 'text-on-surface font-semibold' : 'text-on-surface-variant group-hover:text-on-surface'}`}>
                                  {choice.label}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="building" className="block text-sm font-bold text-on-surface">
                      {t("apply.buildingLabel")}
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">
                        apartment
                      </span>
                      <select
                        id="building"
                        value={selectedDormId}
                        onChange={(e) => setSelectedDormId(e.target.value)}
                        className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl py-3 pl-12 pr-4 text-on-surface font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none transition-all cursor-pointer"
                      >
                        <option value="">{t("apply.buildingPlaceholder")}</option>
                        {buildings.map(b => (
                          <option key={b.dorm_id} value={b.dorm_id}>
                            {b.building_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="notes" className="block text-sm font-bold text-on-surface">
                      {t("apply.notesLabel")}
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-4 text-outline">
                        notes
                      </span>
                      <textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder={t("apply.notesPlaceholder")}
                        rows={5}
                        className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl py-3 pl-12 pr-4 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-primary text-white rounded-xl py-4 font-bold tracking-wide hover:opacity-90 transition-opacity disabled:opacity-70 flex justify-center items-center gap-2 mt-8 shadow-soft"
                  >
                    {isSubmitting ? (
                      <span className="material-symbols-outlined animate-spin">refresh</span>
                    ) : (
                      <span className="material-symbols-outlined">send</span>
                    )}
                    {t("apply.submitButton")}
                  </button>
                </form>
              </>
            )}
          </div>
          
        </div>
      </main>
    </div>
  );
}
