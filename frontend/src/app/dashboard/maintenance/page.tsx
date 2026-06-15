"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardNavbar } from "@/components/dashboard/DashboardNavbar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { useTranslation } from "@/i18n/useTranslation";
import { apiClient } from "@/services/api";

interface Ticket {
  ticket_id: number;
  title: string;
  status: string;
  priority: string;
  created_at: string;
}

export default function StudentMaintenancePage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isAllocated, setIsAllocated] = useState<boolean | null>(null);
  
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("user_role");
    
    if (!token) {
      router.push("/auth");
    } else if (role === "admin") {
      router.push("/admin");
    } else {
      checkAllocation().then(allocated => {
        if (allocated) fetchTickets();
        else setLoading(false);
      });
    }
  }, [router]);

  const checkAllocation = async () => {
    const res = await apiClient<any>("/allocations/me");
    const allocated = !!(res.success && res.data && res.data.allocation);
    setIsAllocated(allocated);
    return allocated;
  };

  const fetchTickets = async () => {
    setLoading(true);
    const res = await apiClient<{ items: Ticket[] }>("/maintenance/tickets/me");
    if (res.success && res.data) {
      setTickets(res.data.items);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    setIsSubmitting(true);
    
    const payload = { title, description, priority };
    const res = await apiClient<any>("/maintenance/tickets", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    if (res.success) {
      setShowForm(false);
      setTitle("");
      setDescription("");
      setPriority("medium");
      fetchTickets();
    } else {
      alert(res.error || "Failed to submit request.");
    }
    setIsSubmitting(false);
  };

  if (!isMounted) return null;

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      <DashboardNavbar />
      <DashboardSidebar />
      
      <main className="lg:ml-64 pt-24 pb-12 px-8 flex-grow">
        <div className="max-w-4xl mx-auto space-y-8">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary-container text-white flex items-center justify-center shadow-soft">
                <span className="material-symbols-outlined text-2xl">build</span>
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-primary font-headline">
                  {t("maintenance.studentTitle")}
                </h1>
                <p className="text-sm text-on-surface-variant">
                  {t("maintenance.studentSubtitle")}
                </p>
              </div>
            </div>
            
            {isAllocated && (
              <button 
                onClick={() => setShowForm(!showForm)}
                className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center gap-2 shadow-soft"
              >
                <span className="material-symbols-outlined">{showForm ? 'close' : 'add'}</span>
                {showForm ? "Cancel" : t("maintenance.newRequest")}
              </button>
            )}
          </div>

          {isAllocated === false ? (
            <div className="bg-surface rounded-2xl p-12 text-center shadow-sm border border-outline-variant">
              <span className="material-symbols-outlined text-6xl text-error/50">gpp_maybe</span>
              <h3 className="text-xl font-bold text-on-surface mt-4">Not Allocated</h3>
              <p className="text-on-surface-variant max-w-md mx-auto mt-2">
                You must be allocated to a room before you can submit maintenance requests.
              </p>
            </div>
          ) : (
            <>
              {showForm && (
                <div className="bg-white rounded-2xl shadow-soft p-8 border-l-4 border-primary mb-8">
                  <h3 className="text-xl font-bold text-on-surface mb-6 font-headline">Submit a New Request</h3>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-on-surface mb-2">{t("maintenance.titleLabel")}</label>
                      <input 
                        type="text" 
                        required
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="e.g., Leaking faucet in bathroom"
                        className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-on-surface mb-2">{t("maintenance.priorityLabel")}</label>
                      <select 
                        value={priority}
                        onChange={e => setPriority(e.target.value)}
                        className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                      >
                        <option value="low">Low (Cosmetic, Non-urgent)</option>
                        <option value="medium">Medium (Annoying, but usable)</option>
                        <option value="high">High (Broken appliance, usability issue)</option>
                        <option value="urgent">Urgent (Safety hazard, severe leak)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-on-surface mb-2">{t("maintenance.descLabel")}</label>
                      <textarea 
                        required
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Please provide as many details as possible..."
                        rows={4}
                        className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
                      />
                    </div>

                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                    >
                      {isSubmitting ? <span className="material-symbols-outlined animate-spin">refresh</span> : <span className="material-symbols-outlined">send</span>}
                      {t("maintenance.submit")}
                    </button>
                  </form>
                </div>
              )}

              {loading ? (
                <div className="py-12 flex justify-center">
                  <span className="material-symbols-outlined text-primary text-4xl animate-spin">refresh</span>
                </div>
              ) : tickets.length === 0 ? (
                <div className="bg-white shadow-soft rounded-2xl p-12 text-center border border-transparent">
                  <div className="w-20 h-20 bg-surface-container-low rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="material-symbols-outlined text-4xl text-outline-variant">home_repair_service</span>
                  </div>
                  <h3 className="text-xl font-bold text-on-surface mb-2 font-headline">{t("maintenance.emptyState")}</h3>
                  <p className="text-on-surface-variant">You have not submitted any maintenance requests.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tickets.map(ticket => (
                    <div key={ticket.ticket_id} className="bg-white shadow-soft rounded-2xl p-6 border border-transparent flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:border-outline-variant/30 transition-colors">
                      <div className="flex gap-4 items-start">
                        <div className={`p-3 rounded-xl mt-1 ${
                          ticket.priority === 'urgent' ? 'bg-error-container text-on-error-container' :
                          ticket.priority === 'high' ? 'bg-orange-50 text-orange-800' :
                          'bg-surface-container-high text-on-surface'
                        }`}>
                          <span className="material-symbols-outlined text-2xl">
                            {ticket.priority === 'urgent' ? 'warning' : 'handyman'}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-bold text-lg text-on-surface">{ticket.title}</h4>
                          <div className="flex flex-wrap gap-2 mt-2 items-center text-xs">
                            <span className="text-on-surface-variant font-medium">Ticket #{ticket.ticket_id}</span>
                            <span className="text-outline-variant">•</span>
                            <span className="text-on-surface-variant">{new Date(ticket.created_at).toLocaleDateString()}</span>
                            <span className="text-outline-variant">•</span>
                            <span className={`font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                              ticket.priority === 'urgent' ? 'text-error' : ticket.priority === 'high' ? 'text-orange-600' : 'text-on-surface-variant'
                            }`}>
                              {ticket.priority} Priority
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="w-full md:w-auto flex justify-end">
                        <span className={`text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-lg flex items-center gap-1 ${
                          ticket.status === 'resolved' ? 'bg-emerald-50 text-emerald-800' :
                          ticket.status === 'in_progress' ? 'bg-blue-50 text-blue-800' :
                          ticket.status === 'escalated' ? 'bg-error-container text-on-error-container' :
                          'bg-amber-50 text-amber-800'
                        }`}>
                          {ticket.status === 'resolved' && <span className="material-symbols-outlined text-[16px]">check_circle</span>}
                          {ticket.status === 'in_progress' && <span className="material-symbols-outlined text-[16px]">engineering</span>}
                          {ticket.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          
        </div>
      </main>
    </div>
  );
}
