"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardNavbar } from "@/components/dashboard/DashboardNavbar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { useTranslation } from "@/i18n/useTranslation";
import { apiClient } from "@/services/api";

export default function CheckoutPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [isMounted, setIsMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [checkoutResult, setCheckoutResult] = useState<{ checkin_id: number; status: string } | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("user_role");
    if (!token) router.push("/auth");
    else if (role === "admin") router.push("/admin");
  }, [router]);

  const handleCheckout = async () => {
    if (!confirm("Are you sure you want to initiate checkout? This will end your residency.")) return;

    setIsSubmitting(true);
    setApiError(null);

    const res = await apiClient<{ checkin_id: number; status: string }>("/lifecycle/checkout", {
      method: "POST",
    });

    if (res.success && res.data) {
      setCheckoutResult(res.data);
    } else {
      setApiError(res.error || "Failed to initiate checkout.");
    }
    setIsSubmitting(false);
  };

  if (!isMounted) return null;

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      <DashboardNavbar />
      <DashboardSidebar />

      <main className="lg:ml-64 pt-24 pb-12 px-8 flex-grow">
        <div className="max-w-2xl mx-auto space-y-8">

          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-full bg-error-container text-on-error-container flex items-center justify-center shadow-soft">
              <span className="material-symbols-outlined text-2xl">logout</span>
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-primary font-headline">Checkout</h1>
              <p className="text-sm text-on-surface-variant">End your housing residency and return your key.</p>
            </div>
          </div>

          <div className="bg-white shadow-soft rounded-2xl p-8 border border-transparent">
            {checkoutResult ? (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-6xl text-emerald-500 mb-4">task_alt</span>
                <h3 className="text-xl font-bold text-on-surface mb-2 font-headline">Checkout Complete</h3>
                <p className="text-on-surface-variant mb-6">Your residency has been terminated. Please return your room key to the housing office.</p>
                <div className="bg-surface-container-lowest rounded-xl p-4 inline-flex gap-8">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-outline-variant">Check-in ID</div>
                    <div className="text-lg font-black text-primary">#{checkoutResult.checkin_id}</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-outline-variant">Status</div>
                    <div className="text-lg font-black text-error capitalize">{checkoutResult.status.replace("_", " ")}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-6xl text-error/30 mb-4">door_front</span>
                <h3 className="text-xl font-bold text-on-surface mb-2 font-headline">Leaving Your Housing?</h3>
                <p className="text-on-surface-variant mb-4 max-w-sm mx-auto">
                  Initiating checkout will end your current housing assignment. This action cannot be undone.
                </p>

                <div className="bg-error-container/30 border border-error-container rounded-xl p-4 text-sm text-on-error-container mb-8 max-w-sm mx-auto">
                  <span className="material-symbols-outlined text-[16px] mr-1 align-text-bottom">warning</span>
                  Make sure all outstanding payments are settled before checking out.
                </div>

                {apiError && (
                  <div className="mb-6 p-4 rounded-lg bg-error-container text-on-error-container text-sm font-semibold flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-lg">error</span>
                    {apiError}
                  </div>
                )}

                <button
                  onClick={handleCheckout}
                  disabled={isSubmitting}
                  className="bg-error text-white px-8 py-4 rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-70 flex items-center gap-2 mx-auto shadow-soft"
                >
                  {isSubmitting ? (
                    <span className="material-symbols-outlined animate-spin">refresh</span>
                  ) : (
                    <span className="material-symbols-outlined">logout</span>
                  )}
                  Initiate Checkout
                </button>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
