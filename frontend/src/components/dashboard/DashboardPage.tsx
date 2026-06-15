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
import { apiClient } from "@/services/api";
import { ChatWidget } from "@/components/ChatWidget";

interface StudentDocument {
  doc_id: number;
  student_id: number;
  doc_type: string;
  file_url: string;
  status: "pending" | "approved" | "rejected" | "incomplete";
  rejection_reason?: string;
  fields_to_edit?: string[];
  fields_updated?: string[];
  is_flagged: boolean;
  created_at: string;
}

export const DashboardPage: React.FC = () => {
  const router = useRouter();
  const { t } = useTranslation();
  
  const [documentPhase, setDocumentPhase] = useState<DocumentPhase>("upload");
  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);

  const fetchDocuments = async (userId: string) => {
    setIsLoadingDocs(true);
    const res = await apiClient<{ documents: StudentDocument[] }>(`/students/${userId}/documents`);
    if (res.success && res.data) {
      setDocuments(res.data.documents);
      
      const docs = res.data.documents;
      if (docs.length === 0) {
        setDocumentPhase("upload");
      } else if (docs.some(d => d.status === "pending")) {
        setDocumentPhase("under_review");
      } else if (docs.every(d => d.status === "approved")) {
        setDocumentPhase("approved");
      } else if (docs.some(d => d.status === "rejected") && !docs.some(d => d.status === "pending")) {
        setDocumentPhase("rejected");
      }
    }
    setIsLoadingDocs(false);
  };

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
      fetchDocuments(userId);
    } else {
      setIsLoadingDocs(false);
    }
  }, [router]);

  if (!isMounted) return null;

  const handleUploadSuccess = () => {
    const userId = localStorage.getItem("user_id");
    if (userId) fetchDocuments(userId);
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      <DashboardNavbar />
      <DashboardSidebar />
      
      {/* Main Content Area */}
      <main className="lg:ms-64 pt-24 pb-12 px-8 flex-grow">
        <div className="max-w-7xl mx-auto grid grid-cols-12 gap-8">
          
          {/* Left Column */}
          <div className="col-span-12 lg:col-span-8 space-y-12">
            <WelcomeBanner />
            <DocumentStatusStepper currentPhase={documentPhase} />
            
            {/* Upload Document Section */}
            <section className="mb-8">
              {(() => {
                const incompleteDoc = documents.find(d => d.status === "incomplete");
                const needsResubmit = incompleteDoc && 
                  incompleteDoc.fields_to_edit?.includes("verification_document") && 
                  incompleteDoc.fields_updated?.includes("verification_document");
                
                const needsUpload = incompleteDoc &&
                  incompleteDoc.fields_to_edit?.includes("verification_document") &&
                  !incompleteDoc.fields_updated?.includes("verification_document");

                if (documentPhase === "upload" || documentPhase === "rejected") {
                  if (needsResubmit) {
                    return (
                      <div className="bg-emerald-50 text-emerald-800 p-6 rounded-xl shadow-soft flex items-center gap-4">
                        <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        <div>
                          <p className="font-bold text-lg">{t("dashboardAdditions.successUpload")}</p>
                          <p className="text-sm mt-1">{t("dashboardAdditions.successUploadDesc").replace("My Verifications", "")} <a href="/dashboard/verification" className="underline font-bold">{t("dashboard.sidebarVerification")}</a></p>
                        </div>
                      </div>
                    );
                  }
                  
                  if (incompleteDoc && !needsUpload) {
                    return (
                      <div className="bg-orange-50 text-orange-900 p-6 rounded-xl shadow-soft flex items-center gap-4 border border-orange-200">
                        <span className="material-symbols-outlined text-3xl">warning</span>
                        <div>
                          <p className="font-bold text-lg">{t("dashboardAdditions.actionRequired")}</p>
                          <p className="text-sm mt-1">{t("dashboardAdditions.actionRequiredDesc").replace("My Verifications", "")} <a href="/dashboard/verification" className="underline font-bold">{t("dashboard.sidebarVerification")}</a></p>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <UploadDocumentCard 
                      onUploadSuccess={handleUploadSuccess} 
                      isUploaded={false} 
                    />
                  );
                }
                
                return (
                  <UploadDocumentCard 
                    onUploadSuccess={handleUploadSuccess} 
                    isUploaded={true} 
                  />
                );
              })()}
            </section>
            
            {/* Documents List */}
            {documents.length > 0 && (
              <section className="mb-8">
                <h3 className="text-xl font-bold text-primary font-headline mb-4">{t("dashboardAdditions.yourDocuments")}</h3>
                <div className="flex flex-col gap-4">
                  {documents.map((doc) => (
                    <div key={doc.doc_id} className="bg-white rounded-xl shadow-soft p-5 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border border-transparent hover:border-outline-variant/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${doc.status === 'approved' ? 'bg-emerald-50 text-emerald-800' : doc.status === 'rejected' ? 'bg-error-container text-on-error-container' : 'bg-blue-50 text-primary'}`}>
                          <span className="material-symbols-outlined">
                            {doc.doc_type === "college_id" ? "badge" : "description"}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-on-surface">
                              {doc.doc_type === "college_id" ? t("dashboardAdditions.collegeId") : doc.doc_type === "enrollment_proof" ? t("dashboardAdditions.enrollmentProof") : doc.doc_type}
                            </h4>
                            {doc.is_flagged && (
                              <span className="bg-orange-50 text-orange-800 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded">
                                {t("dashboardAdditions.flagged")}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-on-surface-variant mt-1">
                            {t("dashboardAdditions.uploaded")}: {new Date(doc.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${
                            doc.status === 'approved' ? 'bg-emerald-50 text-emerald-800' : 
                            doc.status === 'rejected' ? 'bg-error-container text-on-error-container' : 
                            'bg-amber-50 text-amber-800'
                          }`}>
                            {doc.status}
                          </span>
                          <a href={doc.file_url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
                            {t("dashboardAdditions.viewFile")} <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                          </a>
                        </div>
                        {doc.status === 'rejected' && doc.rejection_reason && (
                          <p className="text-xs text-error font-semibold max-w-xs text-right mt-1">
                            {t("dashboardAdditions.reason")}: {doc.rejection_reason}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
            
            {/* Quick Actions Grid */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ActionCard 
                icon="assignment"
                iconBgColor="bg-blue-50"
                iconTextColor="text-primary"
                title={t("dashboard.myApplication")}
                description={t("dashboard.myApplicationDesc")}
                linkText={t("dashboardAdditions.reviewDetails")}
                href="/dashboard/applications"
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
                linkText={t("dashboardAdditions.exploreMap")}
                href="/dashboard/catalog"
              />
              
              <ActionCard 
                icon="group"
                iconBgColor="bg-emerald-50"
                iconTextColor="text-emerald-900"
                title={t("dashboard.roommateMatching")}
                description={t("dashboard.roommateMatchingDesc")}
                linkText={t("dashboardAdditions.viewMatches")}
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
                linkText={t("dashboardAdditions.newTicket")}
                href="/dashboard/maintenance"
              />
            </section>
          </div>
          
          {/* Right Column */}
          <div className="col-span-12 lg:col-span-4">
            <DeadlinesSidepanel />
          </div>
          
        </div>
      </main>
      {/* Housing regulations chatbot — only available to authenticated students */}
      <ChatWidget />
    </div>
  );
};
