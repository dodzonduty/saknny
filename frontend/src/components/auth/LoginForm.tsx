"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FormField } from "../ui/FormField";
import { Button } from "../ui/Button";
import { useTranslation } from "@/i18n/useTranslation";
import { apiClient } from "@/services/api";

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister }) => {
  const { t, locale } = useTranslation();
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear specific field error when typing
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    // Clear API error when user modifies any field
    if (apiError) setApiError(null);
  };

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!formData.email) newErrors.email = t("auth.errors.emailRequired");
    else if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = t("auth.errors.emailInvalid");
    
    if (!formData.password) newErrors.password = t("auth.errors.passwordRequired");
    else if (formData.password.length < 6) newErrors.password = t("auth.errors.passwordMin");

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setApiError(null);

    const response = await apiClient<any>("/auth/login", {
      method: "POST",
      body: JSON.stringify(formData),
    });

    setIsSubmitting(false);

    if (response.success && response.data) {
      localStorage.setItem("access_token", response.data.access_token);
      localStorage.setItem("user_role", response.data.role);
      localStorage.setItem("user_id", String(response.data.user_id));
      
      // Redirect based on role
      if (response.data.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } else {
      setApiError(response.error || "Login failed");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {apiError && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center border border-red-100">
          {apiError}
        </div>
      )}

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
      />
      
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

      <Button
        type="submit"
        variant="primary"
        icon="login"
        iconPosition={locale === "ar" ? "left" : "right"}
        className={`w-full mt-2 ${locale === "ar" ? "rtl:flex-row-reverse" : ""}`}
        disabled={isSubmitting}
      >
        {isSubmitting ? "..." : t("auth.loginButton")}
      </Button>

      <div className="text-center mt-2 font-body text-sm text-on-surface-variant">
        <span>{t("auth.noAccount")}</span>{" "}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="font-bold text-primary hover:text-accent-yellow-hover transition-colors focus:outline-none"
        >
          {t("auth.switchToRegister")}
        </button>
      </div>
    </form>
  );
};
