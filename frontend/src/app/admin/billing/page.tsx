"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/i18n/useTranslation";
import { apiClient } from "@/services/api";

interface Payment {
  payment_id: number;
  student_id: number;
  student_name?: string;
  status: string;
  payment_type: string;
  amount: number;
  created_at: string;
}

export default function AdminBillingPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("user_role");
    
    if (!token) {
      router.push("/auth");
    } else if (role !== "admin") {
      router.push("/dashboard");
    } else {
      fetchPayments();
    }
  }, [router]);

  const fetchPayments = async () => {
    setLoading(true);
    const res = await apiClient<{ items: Payment[] }>("/admin/billing/payments");
    if (res.success && res.data) {
      setPayments(res.data.items);
    }
    setLoading(false);
  };

  const handleRefund = async (paymentId: number) => {
    if (!confirm("Are you sure you want to refund this payment?")) return;
    
    setActionLoading(paymentId);
    const res = await apiClient<any>(`/admin/billing/payments/${paymentId}/refund`, {
      method: "POST",
      body: JSON.stringify({ approved: true })
    });

    if (res.success) {
      fetchPayments();
    } else {
      alert(res.error || "Failed to refund payment.");
    }
    setActionLoading(null);
  };

  if (!isMounted) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary-container text-white flex items-center justify-center shadow-soft">
            <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-primary font-headline">
              {t("billing.adminTitle")}
            </h1>
            <p className="text-sm text-on-surface-variant">
              {t("billing.adminSubtitle")}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <span className="material-symbols-outlined text-primary text-4xl animate-spin">refresh</span>
        </div>
      ) : payments.length === 0 ? (
        <div className="bg-white shadow-soft rounded-2xl p-12 text-center">
          <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">receipt_long</span>
          <h3 className="text-xl font-bold text-on-surface mb-2 font-headline">No Payments Found</h3>
          <p className="text-on-surface-variant">There are currently no recorded payments.</p>
        </div>
      ) : (
        <div className="bg-white shadow-soft rounded-2xl border border-transparent overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-container-lowest border-b-2 border-outline-variant/30">
                <tr>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-on-surface-variant">ID</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-on-surface-variant">Student</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-on-surface-variant">Type</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-on-surface-variant">Amount</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-on-surface-variant">Status</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-on-surface-variant">Date</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-on-surface-variant text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {payments.map(payment => (
                  <tr key={payment.payment_id} className="hover:bg-surface-container-lowest/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-primary">#{payment.payment_id}</td>
                    <td className="px-6 py-4 font-semibold text-on-surface">
                      {payment.student_name ? (
                        <div>
                          <div className="font-bold text-on-surface">{payment.student_name}</div>
                          <div className="text-xs text-on-surface-variant font-medium">ID: {payment.student_id}</div>
                        </div>
                      ) : (
                        payment.student_id
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant capitalize">{payment.payment_type}</td>
                    <td className="px-6 py-4 font-bold text-on-surface">${payment.amount.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${
                        payment.status === 'paid' ? 'bg-emerald-50 text-emerald-800' : 
                        payment.status === 'refunded' ? 'bg-amber-50 text-amber-800' :
                        'bg-blue-50 text-primary'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">
                      {new Date(payment.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {payment.status === 'paid' && (
                        <button
                          onClick={() => handleRefund(payment.payment_id)}
                          disabled={actionLoading === payment.payment_id}
                          className="text-xs font-bold bg-error-container text-on-error-container px-3 py-1.5 rounded hover:bg-error-container/80 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === payment.payment_id ? "..." : "Refund"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
