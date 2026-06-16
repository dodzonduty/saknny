"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslation } from "@/i18n/useTranslation";
import { apiClient } from "@/services/api";

interface VerificationHistory {
  history_id: number;
  doc_id: number;
  actor_role: string;
  actor_id: number;
  action: string;
  comment?: string;
  fields_requested?: string[];
  fields_updated?: string[];
  created_at: string;
}

export default function AdminVerificationReviewPage() {
  const router = useRouter();
  const params = useParams();
  const docId = params.docId as string;
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [doc, setDoc] = useState<any>(null);
  const [student, setStudent] = useState<any>(null);
  const [history, setHistory] = useState<VerificationHistory[]>([]);
  
  const [actionLoading, setActionLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionType, setActionType] = useState<"rejected" | "incomplete" | null>(null);
  const [comment, setComment] = useState("");
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const FIELD_OPTIONS = [
    { id: "verification_document", label: "Verification Document", tKey: "verificationDocLabel" },
    { id: "profile_picture", label: "Profile Picture", tKey: "profilePictureTitle" },
    { id: "nationality_id_photo_front", label: "Nationality ID (Front)", tKey: "nationalIdFrontTitle" },
    { id: "nationality_id_photo_back", label: "Nationality ID (Back)", tKey: "nationalIdBackTitle" },
    { id: "name", label: "Full Name", tKey: "fullNameLabel" },
    { id: "faculty_id", label: "Faculty ID", tKey: "facultyIdLabel" },
    { id: "nationality_id", label: "Nationality ID", tKey: "nationalityIdLabel" },
    { id: "email", label: "Email Address", tKey: "emailLabel" },
    { id: "faculty", label: "Faculty", tKey: "facultyLabel" },
    { id: "home_city", label: "Home City", tKey: "homeCityLabel" },
    { id: "gender", label: "Gender", tKey: "genderLabel" },
  ];

  useEffect(() => {
    fetchData();
  }, [docId]);

  const fetchData = async () => {
    setLoading(true);
    // Fetch the list of documents to find this specific doc details
    const docsRes = await apiClient<{documents: any[]}>(`/admin/verifications?status=pending`);
    const allDocsRes = await apiClient<{documents: any[]}>(`/admin/verifications?status=approved`);
    const rejectedDocsRes = await apiClient<{documents: any[]}>(`/admin/verifications?status=rejected`);
    const incompleteDocsRes = await apiClient<{documents: any[]}>(`/admin/verifications?status=incomplete`);
    
    // We actually just need to fetch the student profile and the history.
    // Let's get the document details from history endpoint if possible, but actually we need the document.
    // Wait, we don't have a GET /verifications/{docId} endpoint. Let's fetch from student instead.
    // For now, we will do a search across all statuses to find the doc.
    const allDocs = [
      ...(docsRes.data?.documents || []),
      ...(allDocsRes.data?.documents || []),
      ...(rejectedDocsRes.data?.documents || []),
      ...(incompleteDocsRes.data?.documents || [])
    ];
    
    const targetDoc = allDocs.find(d => d.doc_id === parseInt(docId));
    if (targetDoc) {
      setDoc(targetDoc);
      
      // Fetch student
      const studentRes = await apiClient<any>(`/students/${targetDoc.student_id}`);
      if (studentRes.success && studentRes.data) {
        setStudent(studentRes.data);
      }
      
      // Fetch history
      const historyRes = await apiClient<any>(`/admin/verifications/${docId}/history`);
      if (historyRes.success && historyRes.data) {
        setHistory(historyRes.data.history);
      }
    }
    setLoading(false);
  };

  const handleReview = async (status: "approved" | "rejected" | "incomplete") => {
    setErrorMsg(null);
    if (status !== "approved") {
      setActionType(status);
      setIsModalOpen(true);
      return;
    }
    
    submitReview(status);
  };

  const submitReview = async (status: "approved" | "rejected" | "incomplete") => {
    setErrorMsg(null);
    if ((status === "rejected" || status === "incomplete") && !comment.trim()) {
      setErrorMsg(t("admin.commentRequiredErr"));
      return;
    }
    if (status === "incomplete" && selectedFields.length === 0) {
      setErrorMsg(t("admin.fieldsRequiredErr"));
      return;
    }

    setActionLoading(true);
    
    const payload = {
      status,
      rejection_reason: status !== "approved" ? comment : undefined,
      fields_to_edit: status === "incomplete" ? selectedFields : undefined
    };

    const res = await apiClient<any>(`/admin/verifications/${docId}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });

    if (res.success) {
      setIsModalOpen(false);
      setComment("");
      setSelectedFields([]);
      router.push("/admin/verifications");
    } else {
      setErrorMsg(res.error || "Failed to update status.");
    }
    setActionLoading(false);
  };

  const toggleField = (fieldId: string) => {
    setSelectedFields(prev => 
      prev.includes(fieldId) ? prev.filter(id => id !== fieldId) : [...prev, fieldId]
    );
  };

  if (loading) {
    return <div className="p-12 flex justify-center"><span className="material-symbols-outlined animate-spin text-4xl text-primary">refresh</span></div>;
  }

  if (!doc || !student) {
    return <div className="p-12 text-center text-error font-bold">{t("admin.docOrStudentNotFound")}</div>;
  }

  // Get fields updated by student since last incomplete mark
  const fieldsUpdated = doc.fields_updated || [];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-variant hover:bg-surface-container-high transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h1 className="text-3xl font-black text-primary font-headline">{t("admin.reviewProfileTitle").replace("{{name}}", student.name)}</h1>
          <div className="flex items-center gap-2 text-sm text-on-surface-variant mt-1">
            {t("admin.statusText")}
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
              doc.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
              doc.status === 'rejected' ? 'bg-error-container text-on-error-container' :
              doc.status === 'incomplete' ? 'bg-orange-100 text-orange-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {doc.status}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Student Data */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-soft">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><span className="material-symbols-outlined text-primary">person</span> {t("admin.studentDetailsTitle")}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: t("admin.fullNameLabel"), value: student.name, field: "name" },
                { label: t("admin.facultyIdLabel"), value: student.faculty_id, field: "faculty_id" },
                { label: t("admin.nationalityIdLabel"), value: student.nationality_id, field: "nationality_id" },
                { label: t("admin.emailLabel"), value: student.email, field: "email" },
                { label: t("admin.facultyLabel"), value: student.faculty, field: "faculty" },
                { label: t("admin.genderLabel"), value: student.gender, field: "gender" },
                { label: t("admin.homeCityLabel"), value: student.home_city, field: "home_city" }
              ].map(item => (
                <div key={item.field} className={`p-4 rounded-xl border-2 ${fieldsUpdated.includes(item.field) ? 'border-primary bg-primary/5' : 'border-outline-variant/30 bg-surface-container-lowest'}`}>
                  <div className="text-xs text-on-surface-variant font-bold uppercase tracking-wider mb-1">{item.label}</div>
                  <div className="font-medium text-on-surface">{item.value || "-"}</div>
                  {fieldsUpdated.includes(item.field) && <div className="text-[10px] text-primary font-bold mt-1">{t("admin.updatedBadge")}</div>}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-soft">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><span className="material-symbols-outlined text-primary">photo_camera</span> {t("admin.identityPhotosTitle")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className={`p-4 rounded-xl border-2 ${fieldsUpdated.includes("profile_picture") ? 'border-primary bg-primary/5' : 'border-outline-variant/30 bg-surface-container-lowest'}`}>
                <div className="text-xs text-on-surface-variant font-bold uppercase tracking-wider mb-3">{t("admin.profilePictureTitle")}</div>
                <div className="aspect-square bg-surface-variant rounded-lg overflow-hidden flex items-center justify-center">
                  {student.profile_picture_url ? (
                    <img src={student.profile_picture_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : <span className="material-symbols-outlined text-4xl text-outline-variant">person</span>}
                </div>
                {fieldsUpdated.includes("profile_picture") && <div className="text-[10px] text-primary font-bold mt-2 text-center">{t("admin.updatedBadge")}</div>}
              </div>

              <div className={`p-4 rounded-xl border-2 ${fieldsUpdated.includes("nationality_id_photo_front") ? 'border-primary bg-primary/5' : 'border-outline-variant/30 bg-surface-container-lowest'}`}>
                <div className="text-xs text-on-surface-variant font-bold uppercase tracking-wider mb-3">{t("admin.nationalIdFrontTitle")}</div>
                <div className="aspect-video bg-surface-variant rounded-lg overflow-hidden flex items-center justify-center">
                  {student.nationality_id_photo_front ? (
                    <a href={student.nationality_id_photo_front} target="_blank" rel="noreferrer">
                      <img src={student.nationality_id_photo_front} alt="ID Front" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                    </a>
                  ) : <span className="material-symbols-outlined text-4xl text-outline-variant">badge</span>}
                </div>
                {fieldsUpdated.includes("nationality_id_photo_front") && <div className="text-[10px] text-primary font-bold mt-2 text-center">{t("admin.updatedBadge")}</div>}
              </div>

              <div className={`p-4 rounded-xl border-2 ${fieldsUpdated.includes("nationality_id_photo_back") ? 'border-primary bg-primary/5' : 'border-outline-variant/30 bg-surface-container-lowest'}`}>
                <div className="text-xs text-on-surface-variant font-bold uppercase tracking-wider mb-3">{t("admin.nationalIdBackTitle")}</div>
                <div className="aspect-video bg-surface-variant rounded-lg overflow-hidden flex items-center justify-center">
                  {student.nationality_id_photo_back ? (
                    <a href={student.nationality_id_photo_back} target="_blank" rel="noreferrer">
                      <img src={student.nationality_id_photo_back} alt="ID Back" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                    </a>
                  ) : <span className="material-symbols-outlined text-4xl text-outline-variant">badge</span>}
                </div>
                {fieldsUpdated.includes("nationality_id_photo_back") && <div className="text-[10px] text-primary font-bold mt-2 text-center">{t("admin.updatedBadge")}</div>}
              </div>

            </div>
          </div>
        </div>

        {/* Right Column: Uploaded Doc & Actions */}
        <div className="space-y-6">
          <div className={`bg-white rounded-2xl p-6 shadow-soft border-2 ${fieldsUpdated.includes("verification_document") ? 'border-primary' : 'border-transparent'}`}>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-primary">description</span> {t("admin.uploadedDocTitle")}</h2>
            <div className="text-sm font-medium mb-4 text-on-surface-variant">
              {t("admin.typeText")} <span className="uppercase text-on-surface">{doc.doc_type.replace("_", " ")}</span>
            </div>
            
            {doc.file_url.endsWith(".pdf") ? (
              <a href={doc.file_url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 bg-error-container text-on-error-container py-4 rounded-xl font-bold">
                <span className="material-symbols-outlined">picture_as_pdf</span> {t("admin.viewPdfBtn")}
              </a>
            ) : (
              <a href={doc.file_url} target="_blank" rel="noreferrer" className="block rounded-xl overflow-hidden border border-outline-variant/30">
                <img src={doc.file_url} alt="Verification" className="w-full h-auto hover:opacity-90 transition-opacity" />
              </a>
            )}
            
            {fieldsUpdated.includes("verification_document") && <div className="text-xs text-primary font-bold mt-3 text-center">{t("admin.studentUploadedNewDoc")}</div>}
            
            {doc.status === "incomplete" && (
              <div className="mt-8 bg-orange-50 text-orange-900 p-6 rounded-xl border border-orange-200 shadow-sm">
                <h3 className="font-bold mb-3 flex items-center gap-2 text-orange-800"><span className="material-symbols-outlined text-xl">warning</span> Pending Student Action</h3>
                <p className="text-sm font-medium mb-4">{doc.rejection_reason || "Document was marked incomplete."}</p>
                <div className="bg-white/60 p-4 rounded-lg border border-orange-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-3 text-orange-800 border-b border-orange-200/50 pb-2">Fields Requested</p>
                  <ul className="list-disc list-inside text-sm space-y-1.5">
                    {(doc.fields_to_edit || []).map((field: string) => {
                      const opt = FIELD_OPTIONS.find(o => o.id === field);
                      return <li key={field} className="font-bold text-orange-900">{opt ? (t(`admin.${opt.tKey}`) || opt.label) : field.replace(/_/g, " ")}</li>;
                    })}
                  </ul>
                </div>
              </div>
            )}
            
            {doc.status === "pending" && (
              <div className="mt-8 space-y-3">
                <button 
                  onClick={() => handleReview("approved")}
                  className="w-full bg-emerald-500 text-white font-bold py-3 rounded-xl hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">check_circle</span> {t("admin.approveVerificationBtn")}
                </button>
                <button 
                  onClick={() => handleReview("incomplete")}
                  className="w-full bg-orange-500 text-white font-bold py-3 rounded-xl hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">edit_note</span> {t("admin.markIncompleteBtn")}
                </button>
                <button 
                  onClick={() => handleReview("rejected")}
                  className="w-full bg-error text-white font-bold py-3 rounded-xl hover:bg-error/90 transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">cancel</span> {t("admin.finalRejectBtn")}
                </button>
              </div>
            )}
          </div>

          {/* History Timeline */}
          <div className="bg-white rounded-2xl p-6 shadow-soft">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-primary">history</span> {t("admin.historyTitle")}</h2>
            <div className="space-y-4">
              {history.length === 0 ? (
                <div className="text-sm text-outline-variant text-center py-4">{t("admin.noHistoryText")}</div>
              ) : (
                history.map(h => (
                  <div key={h.history_id} className="border-l-2 border-outline-variant/30 pl-4 py-1 relative">
                    <div className={`absolute -left-[5px] top-2 w-2 h-2 rounded-full ${h.actor_role === 'admin' ? 'bg-primary' : 'bg-secondary'}`} />
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-bold uppercase">{h.action}</span>
                      <span className="text-[10px] text-outline-variant">{new Date(h.created_at).toLocaleString()}</span>
                    </div>
                    <div className="text-xs text-on-surface-variant font-medium">{t("admin.byRoleText").replace("{{role}}", h.actor_role)}</div>
                    {h.comment && <div className="text-sm mt-2 bg-surface-container-lowest p-2 rounded-lg border border-outline-variant/30">"{h.comment}"</div>}
                    {h.fields_requested && h.fields_requested.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {h.fields_requested.map(f => {
                          const opt = FIELD_OPTIONS.find(o => o.id === f);
                          return (
                            <span key={f} className="text-[9px] bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded uppercase font-bold">
                              {opt ? (t(`admin.${opt.tKey}`) || opt.label) : f.replace(/_/g, " ")}
                            </span>
                          );
                        })}
                      </div>
                    )}
                    {h.fields_updated && h.fields_updated.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {h.fields_updated.map(f => {
                          const opt = FIELD_OPTIONS.find(o => o.id === f);
                          return (
                            <span key={f} className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded uppercase font-bold">
                              {opt ? (t(`admin.${opt.tKey}`) || opt.label) : f.replace(/_/g, " ")}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl">
            <h2 className="text-2xl font-black mb-2 text-primary font-headline">
              {actionType === "incomplete" ? t("admin.markIncompleteModalTitle") : t("admin.finalRejectModalTitle")}
            </h2>
            <p className="text-sm text-on-surface-variant mb-6">
              {actionType === "incomplete" ? t("admin.markIncompleteModalDesc") : t("admin.finalRejectModalDesc")}
            </p>
            
            {errorMsg && (
              <div className="bg-error-container text-on-error-container p-4 rounded-xl mb-6 text-sm font-bold flex items-center gap-2 border border-error/20">
                <span className="material-symbols-outlined">error</span>
                {errorMsg}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2">{t("admin.commentReasonLabel")} <span className="text-error">*</span></label>
                <textarea 
                  className="w-full border-2 border-outline-variant rounded-xl p-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
                  rows={4}
                  placeholder={t("admin.commentPlaceholder")}
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                />
              </div>

              {actionType === "incomplete" && (
                <div>
                  <label className="block text-sm font-bold mb-3">{t("admin.fieldsToEditLabel")} <span className="text-error">*</span></label>
                  <div className="grid grid-cols-2 gap-2">
                    {FIELD_OPTIONS.map(opt => (
                      <label key={opt.id} className="flex items-center gap-2 p-2 rounded-lg border border-outline-variant/50 hover:bg-surface-container-lowest cursor-pointer transition-colors">
                        <input 
                          type="checkbox" 
                          className="accent-primary"
                          checked={selectedFields.includes(opt.id)}
                          onChange={() => toggleField(opt.id)}
                        />
                        <span className="text-xs font-medium">{t(`admin.${opt.tKey}`) || opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-4 mt-8">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-3 rounded-xl font-bold bg-surface-variant text-on-surface hover:bg-surface-container-highest transition-colors"
              >
                {t("admin.cancelBtn")}
              </button>
              <button 
                onClick={() => submitReview(actionType!)}
                disabled={actionLoading}
                className={`flex-1 py-3 rounded-xl font-bold text-white transition-opacity ${actionType === 'incomplete' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-error hover:bg-error/90'} disabled:opacity-50`}
              >
                {actionLoading ? t("admin.processingText") : t("admin.confirmBtn")}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
