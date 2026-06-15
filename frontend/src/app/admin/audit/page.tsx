"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/i18n/useTranslation";
import { apiClient } from "@/services/api";

interface AuditLog {
  audit_id: number;
  actor_role: string;
  actor_id: number;
  action: string;
  entity_type: string;
  entity_id: number;
  before_state: any;
  after_state: any;
  created_at: string;
}

export default function AdminAuditPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("user_role");
    
    if (!token) {
      router.push("/auth");
    } else if (role !== "admin") {
      router.push("/dashboard");
    } else {
      fetchLogs();
    }
  }, [router]);

  const fetchLogs = async () => {
    setLoading(true);
    const res = await apiClient<{ items: AuditLog[] }>("/admin/audit/logs");
    if (res.success && res.data) {
      setLogs(res.data.items);
    }
    setLoading(false);
  };

  if (!isMounted) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary-container text-white flex items-center justify-center shadow-soft">
            <span className="material-symbols-outlined text-2xl">manage_search</span>
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-primary font-headline">
              {t("admin.auditLogsTitle")}
            </h1>
            <p className="text-sm text-on-surface-variant">
              {t("admin.auditLogsSubtitle")}
            </p>
          </div>
        </div>
        
        <button 
          onClick={fetchLogs}
          className="bg-surface-container-low text-on-surface px-4 py-2 rounded-lg font-bold hover:bg-surface-container-high transition-colors flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          {t("admin.refreshLogs")}
        </button>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <span className="material-symbols-outlined text-primary text-4xl animate-spin">refresh</span>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white shadow-soft rounded-2xl p-12 text-center">
          <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">history</span>
          <h3 className="text-xl font-bold text-on-surface mb-2 font-headline">{t("admin.noLogsFound")}</h3>
          <p className="text-on-surface-variant">{t("admin.auditTrailEmpty")}</p>
        </div>
      ) : (
        <div className="bg-white shadow-soft rounded-2xl border border-transparent overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-container-lowest border-b-2 border-outline-variant/30">
                <tr>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-on-surface-variant">ID</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-on-surface-variant">{t("admin.actorCol")}</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-on-surface-variant">{t("admin.actionCol")}</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-on-surface-variant">{t("admin.targetEntityCol")}</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-on-surface-variant">{t("admin.timestampCol")}</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-on-surface-variant text-right">{t("admin.detailsCol")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {logs.map(log => (
                  <React.Fragment key={log.audit_id}>
                    <tr className="hover:bg-surface-container-lowest/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-outline-variant">#{log.audit_id}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                            log.actor_role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-on-surface-variant'
                          }`}>
                            {log.actor_role}
                          </span>
                          <span className="text-sm font-bold text-on-surface">ID: {log.actor_id}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-primary font-mono bg-primary/5 px-2 py-1 rounded">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-on-surface-variant">
                          {log.entity_type} <span className="font-bold text-on-surface">#{log.entity_id}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-on-surface-variant">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setExpandedId(expandedId === log.audit_id ? null : log.audit_id)}
                          className="bg-surface-container-lowest border border-outline-variant/50 text-on-surface px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-surface-container-low transition-colors"
                        >
                          {expandedId === log.audit_id ? t("admin.hideState") : t("admin.viewState")}
                        </button>
                      </td>
                    </tr>
                    
                    {expandedId === log.audit_id && (
                      <tr className="bg-surface-container-lowest">
                        <td colSpan={6} className="px-6 py-6 border-l-4 border-primary">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h5 className="text-xs font-bold uppercase tracking-widest text-outline-variant mb-2">{t("admin.beforeState")}</h5>
                              <pre className="bg-surface-container-low p-4 rounded-xl text-xs font-mono text-on-surface overflow-x-auto border border-outline-variant/30">
                                {log.before_state ? JSON.stringify(log.before_state, null, 2) : "null"}
                              </pre>
                            </div>
                            <div>
                              <h5 className="text-xs font-bold uppercase tracking-widest text-outline-variant mb-2">{t("admin.afterState")}</h5>
                              <pre className="bg-surface-container-low p-4 rounded-xl text-xs font-mono text-emerald-700 overflow-x-auto border border-emerald-200">
                                {log.after_state ? JSON.stringify(log.after_state, null, 2) : "null"}
                              </pre>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
