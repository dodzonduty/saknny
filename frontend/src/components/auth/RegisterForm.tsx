"use client";

import React, { useState } from "react";
import { FormField } from "../ui/FormField";
import { FormSelect } from "../ui/FormSelect";
import { FormTextarea } from "../ui/FormTextarea";
import { Button } from "../ui/Button";
import { useTranslation } from "@/i18n/useTranslation";
import { apiClient } from "@/services/api";

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
  });
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setApiError(null);

    // Don't send confirm_password to API
    const { confirm_password, ...apiData } = formData;
    
    // Convert empty preferences to null/undefined if needed, or just send empty string
    const payload = {
        ...apiData,
        preferences: apiData.preferences || null
    };

    const response = await apiClient<any>("/students/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    setIsSubmitting(false);

    if (response.success) {
      setSuccessMessage("Account created successfully! Please sign in.");
      setTimeout(() => {
          onSwitchToLogin();
      }, 2000);
    } else {
      setApiError(response.error || "Registration failed");
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
