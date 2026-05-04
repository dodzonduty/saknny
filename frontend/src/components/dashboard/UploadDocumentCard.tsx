"use client";

import React, { useState } from "react";
import { Button } from "../ui/Button";
import { FormSelect } from "../ui/FormSelect";
import { apiUploadFile } from "@/services/api";
import { useTranslation } from "@/i18n/useTranslation";

interface UploadDocumentCardProps {
  onUploadSuccess: () => void;
  isUploaded: boolean;
}

export const UploadDocumentCard: React.FC<UploadDocumentCardProps> = ({ onUploadSuccess, isUploaded }) => {
  const { t } = useTranslation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docType, setDocType] = useState("college_id");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const docTypeOptions = [
    { value: "college_id", label: t("dashboard.docTypeCollegeId") },
    { value: "enrollment_proof", label: t("dashboard.docTypeEnrollment") },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError(t("dashboard.noFileSelected"));
      return;
    }

    const userId = localStorage.getItem("user_id");
    if (!userId) {
      setError("User ID not found");
      return;
    }

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("doc_type", docType);

    const response = await apiUploadFile(`/students/${userId}/documents`, formData);

    setIsUploading(false);

    if (response.success) {
      onUploadSuccess();
      setSelectedFile(null);
    } else {
      setError(response.error || "Upload failed");
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-soft hover:shadow-soft-lg transition-all group border-none">
      <div className="flex justify-between items-start mb-6">
        <div className="w-12 h-12 rounded-lg bg-blue-50 text-primary flex items-center justify-center">
          <span className="material-symbols-outlined">cloud_upload</span>
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${
          isUploaded ? "text-emerald-900 bg-emerald-50" : "text-error bg-error-container"
        }`}>
          {isUploaded ? t("dashboard.uploadDone") : t("dashboard.uploadRequired")}
        </span>
      </div>
      
      <h3 className="text-lg font-bold text-primary mb-1 font-headline">{t("dashboard.uploadTitle")}</h3>
      <p className="text-sm text-on-surface-variant mb-4">{t("dashboard.uploadDescription")}</p>
      
      {!isUploaded ? (
        <div className="space-y-4">
          {error && <p className="text-xs text-error font-semibold">{error}</p>}
          
          <FormSelect
            id="docType"
            name="docType"
            label={t("dashboard.docTypeLabel")}
            options={docTypeOptions}
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            disabled={isUploading}
          />
          
          <div className="relative">
            <input 
              type="file" 
              id="fileUpload" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
              onChange={handleFileChange}
              disabled={isUploading}
              accept=".jpg,.jpeg,.png,.pdf"
            />
            <div className="border border-outline-variant border-dashed rounded-lg px-4 py-3 bg-surface-variant flex items-center justify-between">
              <span className="text-sm text-on-surface-variant truncate mr-4">
                {selectedFile ? selectedFile.name : t("dashboard.selectFile")}
              </span>
              <span className="material-symbols-outlined text-outline">attach_file</span>
            </div>
          </div>
          
          <Button 
            variant="primary" 
            className="w-full" 
            onClick={handleUpload}
            disabled={isUploading || !selectedFile}
          >
            {isUploading ? "..." : t("dashboard.uploadButton")}
          </Button>
        </div>
      ) : (
        <div className="bg-emerald-50 text-emerald-800 p-4 rounded-lg flex items-center gap-3">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          <p className="text-sm font-semibold">{t("dashboard.uploadSuccess")}</p>
        </div>
      )}
    </div>
  );
};
