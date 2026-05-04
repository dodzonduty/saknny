"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardNavbar } from "./DashboardNavbar";
import { DashboardSidebar } from "./DashboardSidebar";
import { WelcomeBanner } from "./WelcomeBanner";
import { DocumentStatusStepper, DocumentPhase } from "./DocumentStatusStepper";
import { UploadDocumentCard } from "./UploadDocumentCard";
import { ActionCard } from "./ActionCard";
import { DeadlinesSidepanel } from "./DeadlinesSidepanel";
import { useTranslation } from "@/i18n/useTranslation";

export const DashboardPage: React.FC = () => {
  const router = useRouter();
  const { t } = useTranslation();
  
  const [documentPhase, setDocumentPhase] = useState<DocumentPhase>("upload");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("user_role");
    
    if (!token) {
      router.push("/auth");
    } else if (role === "admin") {
      router.push("/admin");
    }
  }, [router]);

  if (!isMounted) return null;

  const handleUploadSuccess = () => {
    setDocumentPhase("under_review");
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      <DashboardNavbar />
      <DashboardSidebar />
      
      {/* Main Content Area */}
      <main className="lg:ml-64 pt-24 pb-12 px-8 flex-grow">
        <div className="max-w-7xl mx-auto grid grid-cols-12 gap-8">
          
          {/* Left Column */}
          <div className="col-span-12 lg:col-span-8 space-y-12">
            <WelcomeBanner />
            <DocumentStatusStepper currentPhase={documentPhase} />
            
            {/* Upload Document Section */}
            <section className="mb-8">
              <UploadDocumentCard 
                onUploadSuccess={handleUploadSuccess} 
                isUploaded={documentPhase !== "upload"} 
              />
            </section>
            
            {/* Quick Actions Grid */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ActionCard 
                icon="assignment"
                iconBgColor="bg-blue-50"
                iconTextColor="text-primary"
                title={t("dashboard.myApplication")}
                description={t("dashboard.myApplicationDesc")}
                linkText="Review Details"
                badge="Active"
                badgeBgColor="bg-tertiary-fixed"
                badgeTextColor="text-on-tertiary-container"
              />
              
              <ActionCard 
                icon="search"
                iconBgColor="bg-orange-50"
                iconTextColor="text-orange-900"
                title={t("dashboard.findHousing")}
                description={t("dashboard.findHousingDesc")}
                linkText="Explore Map"
              />
              
              <ActionCard 
                icon="group"
                iconBgColor="bg-emerald-50"
                iconTextColor="text-emerald-900"
                title={t("dashboard.roommateMatching")}
                description={t("dashboard.roommateMatchingDesc")}
                linkText="View Potential Matches"
                badge="82% Matched"
                badgeBgColor="bg-transparent"
                badgeTextColor="text-on-surface-variant"
              />
              
              <ActionCard 
                icon="support_agent"
                iconBgColor="bg-purple-50"
                iconTextColor="text-purple-900"
                title={t("dashboard.maintenanceRequest")}
                description={t("dashboard.maintenanceDesc")}
                linkText="New Ticket"
              />
            </section>
          </div>
          
          {/* Right Column */}
          <div className="col-span-12 lg:col-span-4">
            <DeadlinesSidepanel />
          </div>
          
        </div>
      </main>
    </div>
  );
};
