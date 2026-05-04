"use client";

import React from "react";
import { useTranslation } from "@/i18n/useTranslation";

export type DocumentPhase = "upload" | "under_review" | "approved" | "rejected";

interface DocumentStatusStepperProps {
  currentPhase: DocumentPhase;
}

export const DocumentStatusStepper: React.FC<DocumentStatusStepperProps> = ({ currentPhase }) => {
  const { t } = useTranslation();

  const getStepProgress = () => {
    switch (currentPhase) {
      case "upload": return "0%";
      case "under_review": return "50%";
      case "approved": 
      case "rejected": return "100%";
      default: return "0%";
    }
  };

  const isStepCompleted = (step: number) => {
    if (step === 1) return currentPhase !== "upload";
    if (step === 2) return currentPhase === "approved" || currentPhase === "rejected";
    return false;
  };

  const isStepActive = (stepPhase: DocumentPhase[]) => {
    return stepPhase.includes(currentPhase);
  };

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-bold text-primary tracking-tight font-headline">{t("dashboard.documentStatus")}</h2>
      
      {/* Rounded card wrapper */}
      <div className="bg-white p-8 rounded-2xl shadow-soft hover:shadow-soft-lg transition-all border-none">
        
        {/* Steps container - positioned relative so the line can be absolute inside */}
        <div className="relative">
          
          {/* Progress Line - sits behind the circles */}
          <div 
            className="absolute h-1 bg-surface-container-high z-0"
            style={{ top: "18px", left: "16.6%", right: "16.6%" }}
          >
            <div 
              className="h-full bg-primary transition-all duration-1000 ease-in-out" 
              style={{ width: getStepProgress() }}
            ></div>
          </div>

          {/* Steps row */}
          <div className="flex justify-between items-start relative z-10">
            
            {/* Step 1: Upload */}
            <div className="flex flex-col items-center gap-3 w-1/3">
              <div className="bg-white rounded-full p-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isStepCompleted(1) ? "bg-primary text-white" : 
                  isStepActive(["upload"]) ? "border-2 border-primary bg-white text-primary ring-4 ring-primary-fixed/30" : 
                  "bg-surface-container-high text-outline"
                }`}>
                  <span className="material-symbols-outlined text-sm">
                    {isStepCompleted(1) ? "check" : "upload_file"}
                  </span>
                </div>
              </div>
              <span className={`text-xs font-bold text-center uppercase tracking-tight leading-tight ${
                isStepActive(["upload"]) || isStepCompleted(1) ? "text-primary" : "text-outline"
              }`}>
                {t("dashboard.stepUpload")}
              </span>
            </div>

            {/* Step 2: Under Review */}
            <div className="flex flex-col items-center gap-3 w-1/3">
              <div className="bg-white rounded-full p-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isStepCompleted(2) ? "bg-primary text-white" : 
                  isStepActive(["under_review"]) ? "border-2 border-primary bg-white text-primary ring-4 ring-primary-fixed/30" : 
                  "bg-surface-container-high text-outline"
                }`}>
                  <span className="material-symbols-outlined text-sm">
                    {isStepCompleted(2) ? "check" : "pending"}
                  </span>
                </div>
              </div>
              <span className={`text-xs font-bold text-center uppercase tracking-tight leading-tight ${
                isStepActive(["under_review"]) || isStepCompleted(2) ? "text-primary" : "text-outline"
              }`}>
                {t("dashboard.stepUnderReview")}
              </span>
            </div>

            {/* Step 3: Approved/Rejected */}
            <div className="flex flex-col items-center gap-3 w-1/3">
              <div className="bg-white rounded-full p-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  currentPhase === "approved" ? "bg-primary text-white" : 
                  currentPhase === "rejected" ? "bg-error text-white" : 
                  "bg-surface-container-high text-outline"
                }`}>
                  <span className="material-symbols-outlined text-sm">
                    {currentPhase === "approved" ? "verified" : currentPhase === "rejected" ? "cancel" : "verified"}
                  </span>
                </div>
              </div>
              <span className={`text-xs font-bold text-center uppercase tracking-tight leading-tight ${
                 currentPhase === "approved" ? "text-primary" : currentPhase === "rejected" ? "text-error" : "text-outline"
              }`}>
                {currentPhase === "rejected" ? t("dashboard.stepRejected") : t("dashboard.stepApproved")}
              </span>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};
