"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardNavbar } from "@/components/dashboard/DashboardNavbar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { useTranslation } from "@/i18n/useTranslation";
import { apiClient } from "@/services/api";

interface Payment {
  payment_id: number;
  status: string;
  payment_type: string;
  amount: number;
  currency: string;
  created_at: string;
}

export default function StudentBillingPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payType, setPayType] = useState("rent");
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("user_role");
    
    if (!token) {
      router.push("/auth");
    } else if (role === "admin") {
      router.push("/admin");
    } else {
      fetchPayments();
    }
  }, [router]);

  const fetchPayments = async () => {
    setLoading(true);
    const res = await apiClient<{ items: Payment[] }>("/billing/payments/me");
    if (res.success && res.data) {
      setPayments(res.data.items);
    }
    setLoading(false);
  };

  const handleMakePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payAmount) return;

    setIsPaying(true);
    
    // 1. Initiate Payment
    const initPayload = {
      amount: parseFloat(payAmount),
      payment_type: payType
    };
    
    const initRes = await apiClient<{ payment_id: number }>("/billing/payments/initiate", {
      method: "POST",
      body: JSON.stringify(initPayload)
    });

    if (initRes.success && initRes.data) {
      const paymentId = initRes.data.payment_id;
      
      // 2. Mock processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 3. Confirm Payment
      const confirmRes = await apiClient<any>(`/billing/payments/${paymentId}/confirm`, {
        method: "POST",
        body: JSON.stringify({ status: "paid" })
      });
      
      if (confirmRes.success) {
        setShowPayModal(false);
        setPayAmount("");
        fetchPayments();
      } else {
        alert(confirmRes.error || "Payment confirmation failed");
      }
    } else {
      alert(initRes.error || "Failed to initiate payment");
    }
    setIsPaying(false);
  };

  if (!isMounted) return null;

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      <DashboardNavbar />
      <DashboardSidebar />
      
      <main className="lg:ms-64 pt-24 pb-12 px-8 flex-grow relative">
        <div className="max-w-4xl mx-auto space-y-8">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary-container text-white flex items-center justify-center shadow-soft">
                <span className="material-symbols-outlined text-2xl">payments</span>
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-primary font-headline">
                  {t("billing.studentTitle")}
                </h1>
                <p className="text-sm text-on-surface-variant">
                  {t("billing.studentSubtitle")}
                </p>
              </div>
            </div>
            
            <button 
              onClick={() => setShowPayModal(true)}
              className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center gap-2 shadow-soft"
            >
              <span className="material-symbols-outlined">add_card</span>
              {t("billing.makePayment")}
            </button>
          </div>

          {showPayModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 relative">
                <button onClick={() => setShowPayModal(false)} className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface">
                  <span className="material-symbols-outlined">close</span>
                </button>
                <h3 className="text-2xl font-black text-on-surface mb-6 font-headline">{t("billing.newPayment")}</h3>
                
                <form onSubmit={handleMakePayment} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-on-surface mb-2">{t("billing.paymentTypeLabel")}</label>
                    <select 
                      value={payType}
                      onChange={(e) => setPayType(e.target.value)}
                      className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    >
                      <option value="rent">{t("billing.rentPayment")}</option>
                      <option value="deposit">{t("billing.housingDeposit")}</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-on-surface mb-2">{t("billing.amountUsd")}</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold">$</span>
                      <input 
                        type="number" 
                        required
                        min="1"
                        step="0.01"
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                        className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl pl-8 pr-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-lg font-bold"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  
                  <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 flex gap-3 items-center">
                    <span className="material-symbols-outlined text-primary text-3xl">credit_card</span>
                    <div className="text-sm text-on-surface-variant">
                      {t("billing.simulatedGatewayDesc")}
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isPaying}
                    className="w-full bg-emerald-500 text-white rounded-xl py-4 font-black tracking-wide hover:bg-emerald-600 transition-colors disabled:opacity-70 flex justify-center items-center gap-2"
                  >
                    {isPaying ? (
                      <span className="material-symbols-outlined animate-spin">refresh</span>
                    ) : (
                      <span className="material-symbols-outlined">lock</span>
                    )}
                    {isPaying ? t("billing.processing") : t("billing.payNow")}
                  </button>
                </form>
              </div>
            </div>
          )}

          {loading ? (
            <div className="py-12 flex justify-center">
              <span className="material-symbols-outlined text-primary text-4xl animate-spin">refresh</span>
            </div>
          ) : payments.length === 0 ? (
            <div className="bg-white shadow-soft rounded-2xl p-12 text-center border border-transparent">
              <div className="w-20 h-20 bg-surface-container-low rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-4xl text-outline-variant">receipt</span>
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-2 font-headline">{t("billing.emptyState")}</h3>
              <p className="text-on-surface-variant max-w-md mx-auto">
                {t("billing.emptyStateDesc")}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map(payment => (
                <div key={payment.payment_id} className="bg-white shadow-soft rounded-2xl p-6 border border-transparent flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      payment.status === 'paid' ? 'bg-emerald-50 text-emerald-600' :
                      payment.status === 'refunded' ? 'bg-amber-50 text-amber-600' :
                      'bg-blue-50 text-primary'
                    }`}>
                      <span className="material-symbols-outlined">
                        {payment.status === 'paid' ? 'check_circle' : payment.status === 'refunded' ? 'settings_backup_restore' : 'schedule'}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-on-surface capitalize">
                        {payment.payment_type} {t("billing.paymentLabel")}
                      </h4>
                      <div className="text-xs text-on-surface-variant">
                        {t("billing.transactionHash")}{payment.payment_id} • {new Date(payment.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <span className="text-xl font-black text-on-surface">
                      ${payment.amount.toFixed(2)} <span className="text-xs font-bold text-outline-variant">{payment.currency}</span>
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded mt-1 ${
                      payment.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                      payment.status === 'refunded' ? 'bg-amber-100 text-amber-800' :
                      'bg-blue-100 text-primary'
                    }`}>
                      {payment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          
        </div>
      </main>
    </div>
  );
}
