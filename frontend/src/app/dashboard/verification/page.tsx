"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardNavbar } from "@/components/dashboard/DashboardNavbar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DocumentStatusStepper } from "@/components/dashboard/DocumentStatusStepper";
import { apiClient } from "@/services/api";

export default function MyVerificationPage() {
  const router = useRouter();
  
  const [isMounted, setIsMounted] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
      fetchVerificationData(storedUserId);
    }
  }, [router]);

  const fetchVerificationData = async (id: string) => {
    setLoading(true);
    const docsRes = await apiClient<{documents: any[]}>(`/students/${id}/documents`);
    if (docsRes.success && docsRes.data) {
      setDocuments(docsRes.data.documents);
      
      if (docsRes.data.documents.length > 0) {
        const latestDoc = docsRes.data.documents[0];
        // Fetch history if needed, but the student history endpoint isn't fully set up for students!
        // Actually, we didn't expose GET /verifications/{docId}/history to students in students.py.
        // We only created it in admin.py.
        // That's fine, we can display the status and rejection_reason from the document directly, 
        // or we can just rely on the document's history. But wait, without history, we can't show a timeline.
        // Let's just show the current status and fields requested.
      }
    }
    setLoading(false);
  };

  const handleResubmit = async () => {
    if (!userId) return;
    const latestDoc = documents[0];
    
    if (latestDoc?.fields_to_edit?.includes("verification_document") && !latestDoc?.fields_updated?.includes("verification_document")) {
      setErrorMsg("You must upload a new verification document from your Dashboard first.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    const res = await apiClient<any>(`/students/${userId}/verification-resubmit`, {
      method: "POST"
    });
    if (res.success) {
      alert("Resubmitted successfully!");
      fetchVerificationData(userId);
    } else {
      setErrorMsg(res.error || "Failed to resubmit");
    }
    setLoading(false);
  };

  if (!isMounted) return null;

  const latestDoc = documents[0];

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      <DashboardNavbar />
      <DashboardSidebar />
      
      <main className="lg:ml-64 pt-24 pb-12 px-8 flex-grow">
        <div className="max-w-4xl mx-auto space-y-8">
          
          <h1 className="text-3xl font-black tracking-tight text-primary font-headline">
            My Verification
          </h1>

          {loading ? (
            <div className="p-12 flex justify-center"><span className="material-symbols-outlined animate-spin text-4xl text-primary">refresh</span></div>
          ) : !latestDoc ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-soft">
              <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">description</span>
              <h2 className="text-xl font-bold mb-2">No Verification Document Found</h2>
              <p className="text-on-surface-variant mb-6">Please upload your verification document from the home dashboard.</p>
              <button 
                onClick={() => router.push("/dashboard")}
                className="bg-primary text-white font-bold py-3 px-6 rounded-xl hover:bg-primary/90 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-8 shadow-soft">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold">Current Status</h2>
                    <p className="text-sm text-on-surface-variant mt-1">Uploaded on {new Date(latestDoc.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider ${
                    latestDoc.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                    latestDoc.status === 'rejected' ? 'bg-error-container text-on-error-container' :
                    latestDoc.status === 'incomplete' ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {latestDoc.status === 'pending' ? 'Under Review' : latestDoc.status}
                  </span>
                </div>

                {latestDoc.status === "rejected" && (
                  <div className="bg-error-container text-on-error-container p-6 rounded-xl border border-error/20 mb-8">
                    <h3 className="font-bold mb-2 flex items-center gap-2"><span className="material-symbols-outlined">cancel</span> Application Rejected</h3>
                    <p className="text-sm">{latestDoc.rejection_reason}</p>
                    <p className="text-xs font-bold mt-4 opacity-80">This decision is final and your profile cannot be edited.</p>
                  </div>
                )}

                {latestDoc.status === "incomplete" && (
                  <div className="bg-orange-50 text-orange-900 p-6 rounded-xl border border-orange-200 mb-8">
                    <h3 className="font-bold mb-2 flex items-center gap-2 text-orange-800"><span className="material-symbols-outlined">warning</span> Action Required</h3>
                    <p className="text-sm font-medium mb-4">{latestDoc.rejection_reason}</p>
                    
                    <div className="bg-white/60 p-4 rounded-lg mb-6">
                      <p className="text-xs font-bold uppercase tracking-wider mb-3 text-orange-800">Fields to Update:</p>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {latestDoc.fields_to_edit?.map((field: string) => (
                          <li key={field} className="font-medium">{field.replace(/_/g, " ")}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <p className="text-sm mb-4">Please go to your Profile to update these fields, or to the Dashboard if you need to re-upload your document. Once you have made all requested changes, click Resubmit below.</p>
                    
                    {errorMsg && (
                      <div className="bg-error-container text-on-error-container p-4 rounded-xl mb-4 text-sm font-bold flex items-center gap-2 border border-error/20">
                        <span className="material-symbols-outlined">error</span>
                        {errorMsg}
                      </div>
                    )}

                    <div className="flex gap-4">
                      <button 
                        onClick={() => router.push("/dashboard/profile")}
                        className="bg-white text-orange-800 font-bold py-2 px-6 rounded-lg border border-orange-200 hover:bg-orange-100 transition-colors"
                      >
                        Edit Profile
                      </button>
                      <button 
                        onClick={handleResubmit}
                        className="bg-orange-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[18px]">send</span>
                        Resubmit Application
                      </button>
                    </div>
                  </div>
                )}

                {latestDoc.status === "pending" && (
                  <div className="bg-blue-50 text-blue-900 p-6 rounded-xl border border-blue-200 mb-8">
                    <h3 className="font-bold mb-2 flex items-center gap-2 text-blue-800"><span className="material-symbols-outlined">info</span> Under Review</h3>
                    <p className="text-sm">Your application is currently being reviewed by our administration team. This usually takes 1-2 business days. We will notify you once a decision has been made.</p>
                  </div>
                )}
                
                {latestDoc.status === "approved" && (
                  <div className="bg-emerald-50 text-emerald-900 p-6 rounded-xl border border-emerald-200 mb-8">
                    <h3 className="font-bold mb-2 flex items-center gap-2 text-emerald-800"><span className="material-symbols-outlined">verified</span> Verification Approved</h3>
                    <p className="text-sm">Congratulations! Your verification has been approved. You are now eligible to apply for housing.</p>
                  </div>
                )}
                
                <h3 className="text-lg font-bold mb-4 border-t border-outline-variant/30 pt-6">Submitted Document</h3>
                {latestDoc.file_url.endsWith(".pdf") ? (
                  <a href={latestDoc.file_url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 bg-surface-variant text-on-surface py-4 rounded-xl font-bold hover:bg-surface-container-highest">
                    <span className="material-symbols-outlined">picture_as_pdf</span> View PDF Document
                  </a>
                ) : (
                  <a href={latestDoc.file_url} target="_blank" rel="noreferrer" className="block max-w-sm rounded-xl overflow-hidden border border-outline-variant/30 hover:opacity-90">
                    <img src={latestDoc.file_url} alt="Verification" className="w-full h-auto" />
                  </a>
                )}
              </div>
            </div>
          )}
          
        </div>
      </main>
    </div>
  );
}
