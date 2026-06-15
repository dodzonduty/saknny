"use client";

import React, { useState, useRef } from "react";
import { FormField } from "../ui/FormField";
import { FormSelect } from "../ui/FormSelect";
import { FormTextarea } from "../ui/FormTextarea";
import { Button } from "../ui/Button";
import { useTranslation } from "@/i18n/useTranslation";
import { apiUploadFile } from "@/services/api";

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
  const { t, locale } = useTranslation();

  const [formData, setFormData] = useState({
    faculty_id: "",
    name: "",
    email: "",
    gender: "",
    home_city: "",
    password: "",
    confirm_password: "",
    preferences: "",
    nationality_id: "",
    faculty: "",
  });

  const [files, setFiles] = useState<{
    profile_picture: File | null;
    nationality_id_photo_front: File | null;
    nationality_id_photo_back: File | null;
  }>({
    profile_picture: null,
    nationality_id_photo_front: null,
    nationality_id_photo_back: null,
  });
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRefs = {
    profile_picture: useRef<HTMLInputElement>(null),
    nationality_id_photo_front: useRef<HTMLInputElement>(null),
    nationality_id_photo_back: useRef<HTMLInputElement>(null),
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    if (apiError) setApiError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files: selectedFiles } = e.target;
    if (selectedFiles && selectedFiles.length > 0) {
      setFiles((prev) => ({ ...prev, [name]: selectedFiles[0] }));
      if (errors[name]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    }
  };

  const renderFileUpload = (
    name: keyof typeof files,
    label: string,
    icon: string,
    description: string,
    ref: React.RefObject<HTMLInputElement>
  ) => {
    const file = files[name];
    const error = errors[name];
    return (
      <div 
        className={`flex flex-col gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer ${
          error ? "border-red-400 bg-red-50/50" : file ? "border-emerald-400 bg-emerald-50/50" : "border-outline-variant/30 bg-surface-variant/10 hover:bg-surface-variant/20 hover:border-primary/50"
        }`}
        onClick={() => ref.current?.click()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              file ? "bg-emerald-100 text-emerald-600" : "bg-primary-container text-white"
            }`}>
              <span className="material-symbols-outlined">{icon}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-on-surface">{label}</span>
              <span className="text-xs text-on-surface-variant line-clamp-1">{file ? file.name : description}</span>
            </div>
          </div>
          {file && (
            <span className="material-symbols-outlined text-emerald-500">check_circle</span>
          )}
        </div>
        <input
          type="file"
          name={name}
          ref={ref}
          onChange={handleFileChange}
          accept="image/*"
          disabled={isSubmitting}
          className="hidden"
        />
        {error && <span className="text-xs text-red-500 font-semibold">{error}</span>}
      </div>
    );
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.faculty_id) newErrors.faculty_id = t("auth.errors.facultyIdRequired");
    if (!formData.name) newErrors.name = t("auth.errors.nameRequired");
    if (!formData.email) newErrors.email = t("auth.errors.emailRequired");
    else if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = t("auth.errors.emailInvalid");
    if (!formData.gender) newErrors.gender = t("auth.errors.genderRequired");
    if (!formData.home_city) newErrors.home_city = t("auth.errors.homeCityRequired");
    
    if (!formData.password) newErrors.password = t("auth.errors.passwordRequired");
    else if (formData.password.length < 6) newErrors.password = t("auth.errors.passwordMin");
    
    if (formData.password !== formData.confirm_password) {
        newErrors.confirm_password = t("auth.errors.passwordMismatch");
    }

    if (!formData.nationality_id || formData.nationality_id.length !== 14) {
      newErrors.nationality_id = t("auth.errors.nationalityIdLen");
    }
    if (!formData.faculty) newErrors.faculty = t("auth.errors.facultyRequired");
    
    if (!files.profile_picture) newErrors.profile_picture = t("auth.errors.profilePicRequired");
    if (!files.nationality_id_photo_front) newErrors.nationality_id_photo_front = t("auth.errors.nationalIdFrontRequired");
    if (!files.nationality_id_photo_back) newErrors.nationality_id_photo_back = t("auth.errors.nationalIdBackRequired");

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setApiError(null);

    const payload = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key !== "confirm_password" && value) {
        payload.append(key, value);
      }
    });

    Object.entries(files).forEach(([key, file]) => {
      if (file) {
        payload.append(key, file);
      }
    });

    const response = await apiUploadFile<any>("/students/register", payload);

    setIsSubmitting(false);

    if (response.success) {
      setSuccessMessage(t("auth.registerSuccess"));
      setTimeout(() => {
          onSwitchToLogin();
      }, 2000);
    } else {
      setApiError(response.error || t("auth.registerFailed"));
    }
  };

  const genderOptions = [
    { value: "", label: t("auth.fields.genderPlaceholder") },
    { value: "M", label: t("auth.fields.genderMale") },
    { value: "F", label: t("auth.fields.genderFemale") },
  ];

  if (successMessage) {
      return (
          <div className="flex flex-col items-center justify-center p-8 text-center gap-4">
              <span className="material-symbols-outlined text-6xl text-emerald-500">check_circle</span>
              <p className="font-headline text-xl text-primary font-bold">{successMessage}</p>
          </div>
      );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {apiError && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center border border-red-100">
          {apiError}
        </div>
      )}

      {/* Grid for desktop, stack for mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FormField
            id="faculty_id"
            name="faculty_id"
            type="text"
            label={t("auth.fields.facultyId")}
            icon="badge"
            value={formData.faculty_id}
            onChange={handleChange}
            error={errors.faculty_id}
            disabled={isSubmitting}
            maxLength={20}
        />
        
        <FormField
            id="name"
            name="name"
            type="text"
            label={t("auth.fields.name")}
            icon="person"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            disabled={isSubmitting}
            maxLength={100}
        />

        <FormField
            id="email"
            name="email"
            type="email"
            label={t("auth.fields.email")}
            icon="mail"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            disabled={isSubmitting}
            maxLength={100}
        />

        <FormSelect
            id="gender"
            name="gender"
            label={t("auth.fields.gender")}
            icon="wc"
            value={formData.gender}
            onChange={handleChange}
            options={genderOptions}
            error={errors.gender}
            required
            disabled={isSubmitting}
        />

        <FormField
            id="home_city"
            name="home_city"
            type="text"
            label={t("auth.fields.homeCity")}
            icon="location_city"
            value={formData.home_city}
            onChange={handleChange}
            error={errors.home_city}
            disabled={isSubmitting}
            maxLength={50}
        />

        <FormField
            id="nationality_id"
            name="nationality_id"
            type="text"
            label={t("auth.fields.nationalityId")}
            icon="pin"
            value={formData.nationality_id}
            onChange={(e) => {
              // Only allow numbers
              const val = e.target.value.replace(/[^0-9]/g, '');
              handleChange({ ...e, target: { ...e.target, name: e.target.name, value: val } } as any);
            }}
            error={errors.nationality_id}
            disabled={isSubmitting}
            maxLength={14}
        />

        <FormField
            id="faculty"
            name="faculty"
            type="text"
            label={t("auth.fields.faculty")}
            icon="school"
            value={formData.faculty}
            onChange={handleChange}
            error={errors.faculty}
            disabled={isSubmitting}
            maxLength={100}
        />
        
        {/* Empty div for grid alignment on desktop if needed, or let preferences span */}
        <div className="hidden lg:block"></div>

        <FormField
            id="password"
            name="password"
            type="password"
            label={t("auth.fields.password")}
            icon="lock"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            disabled={isSubmitting}
        />

        <FormField
            id="confirm_password"
            name="confirm_password"
            type="password"
            label={t("auth.fields.confirmPassword")}
            icon="lock"
            value={formData.confirm_password}
            onChange={handleChange}
            error={errors.confirm_password}
            disabled={isSubmitting}
        />
      </div>

      <div className="flex flex-col gap-4 mt-2">
        <h3 className="text-lg font-bold text-primary font-headline border-b border-outline-variant/30 pb-2">{t("auth.documentsTitle")}</h3>
        <p className="text-xs text-on-surface-variant -mt-2 mb-2">{t("auth.documentsDesc")}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            {renderFileUpload(
              "profile_picture", 
              t("auth.profilePictureLabel"), 
              "face", 
              t("auth.profilePictureDesc"), 
              fileInputRefs.profile_picture
            )}
          </div>
          {renderFileUpload(
            "nationality_id_photo_front", 
            t("auth.nationalIdFrontLabel"), 
            "badge", 
            t("auth.nationalIdFrontDesc"), 
            fileInputRefs.nationality_id_photo_front
          )}
          {renderFileUpload(
            "nationality_id_photo_back", 
            t("auth.nationalIdBackLabel"), 
            "credit_card", 
            t("auth.nationalIdBackDesc"), 
            fileInputRefs.nationality_id_photo_back
          )}
        </div>
      </div>

      <FormTextarea
        id="preferences"
        name="preferences"
        label={t("auth.fields.preferences")}
        icon="tune"
        placeholder={t("auth.fields.preferencesPlaceholder")}
        value={formData.preferences}
        onChange={handleChange}
        error={errors.preferences}
        disabled={isSubmitting}
        maxLength={200}
        required={false}
      />

      <Button
        type="submit"
        variant="primary"
        icon="how_to_reg"
        iconPosition={locale === "ar" ? "left" : "right"}
        className={`w-full mt-2 ${locale === "ar" ? "rtl:flex-row-reverse" : ""}`}
        disabled={isSubmitting}
      >
        {isSubmitting ? "..." : t("auth.registerButton")}
      </Button>

      <div className="text-center mt-2 font-body text-sm text-on-surface-variant">
        <span>{t("auth.hasAccount")}</span>{" "}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-bold text-primary hover:text-accent-yellow-hover transition-colors focus:outline-none"
        >
          {t("auth.switchToLogin")}
        </button>
      </div>
    </form>
  );
};
