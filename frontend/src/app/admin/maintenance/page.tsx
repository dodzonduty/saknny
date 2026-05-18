"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/i18n/useTranslation";
import { apiClient } from "@/services/api";

interface Ticket {
  ticket_id: number;
  student_id: number;
  room_id: number | null;
  status: string;
  priority: string;
}

export default function AdminMaintenancePage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [statusFilter, setStatusFilter] = useState("open");
  
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("user_role");
    
    if (!token) {
      router.push("/auth");
    } else if (role !== "admin") {
      router.push("/dashboard");
    } else {
      fetchTickets(statusFilter);
    }
  }, [router, statusFilter]);

  const fetchTickets = async (status: string) => {
    setLoading(true);
    const res = await apiClient<{ items: Ticket[] }>(`/admin/maintenance/tickets?status=${status}`);
    if (res.success && res.data) {
      setTickets(res.data.items);
    }
    setLoading(false);
  };

  const handleStatusChange = async (ticketId: number, newStatus: string) => {
    setActionLoadingId(ticketId);
    const res = await apiClient<any>(`/admin/maintenance/tickets/${ticketId}/assign`, {
      method: "PUT",
      body: JSON.stringify({ status: newStatus })
    });

    if (res.success) {
      fetchTickets(statusFilter);
    } else {
      alert(res.error || "Failed to update ticket status.");
    }
    setActionLoadingId(null);
  };

  const handleEscalate = async (ticketId: number) => {
    const reason = prompt("Reason for escalation?");
    if (!reason) return;

    setActionLoadingId(ticketId);
    const res = await apiClient<any>(`/admin/maintenance/tickets/${ticketId}/escalate`, {
      method: "POST",
      body: JSON.stringify({ reason })
    });

    if (res.success) {
      fetchTickets(statusFilter);
    } else {
      alert(res.error || "Failed to escalate ticket.");
    }
    setActionLoadingId(null);
  };

  if (!isMounted) return null;

  const getStatusTabs = () => [
    { id: "open", label: "Open" },
    { id: "assigned", label: "Assigned" },
    { id: "in_progress", label: "In Progress" },
    { id: "escalated", label: "Escalated" },
    { id: "resolved", label: "Resolved" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary-container text-white flex items-center justify-center shadow-soft">
            <span className="material-symbols-outlined text-2xl">home_repair_service</span>
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-primary font-headline">
              {t("maintenance.adminTitle")}
            </h1>
            <p className="text-sm text-on-surface-variant">
              {t("maintenance.adminSubtitle")}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-soft border border-transparent p-1 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {getStatusTabs().map(tab => (
            <button 
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-6 py-3 rounded-lg text-sm font-bold transition-colors ${
                statusFilter === tab.id 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <span className="material-symbols-outlined text-primary text-4xl animate-spin">refresh</span>
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-white shadow-soft rounded-2xl p-12 text-center">
          <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">task_alt</span>
          <h3 className="text-xl font-bold text-on-surface mb-2 font-headline">No Tickets Found</h3>
          <p className="text-on-surface-variant">There are currently no tickets in "{statusFilter}" status.</p>
        </div>
      ) : (
        <div className="bg-white shadow-soft rounded-2xl border border-transparent overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-container-lowest border-b-2 border-outline-variant/30">
                <tr>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-on-surface-variant">Ticket ID</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-on-surface-variant">Priority</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-on-surface-variant">Room ID</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-on-surface-variant">Student ID</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-on-surface-variant text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {tickets.map(ticket => (
                  <tr key={ticket.ticket_id} className="hover:bg-surface-container-lowest/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-primary">#{ticket.ticket_id}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${
                        ticket.priority === 'urgent' ? 'bg-error-container text-on-error-container' : 
                        ticket.priority === 'high' ? 'bg-orange-50 text-orange-800' :
                        'bg-surface-container-high text-on-surface'
                      }`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-on-surface-variant">
                      {ticket.room_id || "Unassigned"}
                    </td>
                    <td className="px-6 py-4 font-semibold text-on-surface-variant">
                      {ticket.student_id}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {statusFilter !== 'resolved' && (
                          <select
                            disabled={actionLoadingId === ticket.ticket_id}
                            onChange={(e) => handleStatusChange(ticket.ticket_id, e.target.value)}
                            value=""
                            className="bg-surface-container-low text-xs font-bold px-3 py-2 rounded-lg outline-none cursor-pointer hover:bg-surface-container-high"
                          >
                            <option value="" disabled>Change Status...</option>
                            {statusFilter !== 'assigned' && <option value="assigned">Mark Assigned</option>}
                            {statusFilter !== 'in_progress' && <option value="in_progress">Mark In Progress</option>}
                            <option value="resolved">Mark Resolved</option>
                          </select>
                        )}
                        
                        {statusFilter !== 'escalated' && statusFilter !== 'resolved' && (
                          <button
                            onClick={() => handleEscalate(ticket.ticket_id)}
                            disabled={actionLoadingId === ticket.ticket_id}
                            className="text-xs font-bold bg-error-container text-on-error-container px-3 py-2 rounded-lg hover:bg-error-container/80 transition-colors disabled:opacity-50"
                          >
                            Escalate
                          </button>
                        )}
                      </div>
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
