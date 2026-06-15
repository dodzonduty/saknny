"use client";

import React, { useState, useEffect } from "react";
import { apiClient } from "@/services/api";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

import { useTranslation } from "@/i18n/useTranslation";

interface StudentLogReportResponse {
  summary: {
    period_days: number;
    attended: number;
    missed: number;
    overall_rate: number;
    is_allocated: boolean;
  };
  logs: {
    student_name: string;
    student_id: number;
    building_name: string;
    room_number: string;
    day: string;
    attendance_time: string | null;
    status: "attended" | "missed";
  }[];
}

interface ProfileLogTabProps {
  studentId: string;
}

export const ProfileLogTab: React.FC<ProfileLogTabProps> = ({ studentId }) => {
  const { t } = useTranslation();
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<StudentLogReportResponse | null>(null);

  // Initialize dates
  useEffect(() => {
    const today = new Date();
    setEndDate(today.toISOString().split('T')[0]);
    
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    setStartDate(firstDay.toISOString().split('T')[0]);
  }, []);

  // Fetch report whenever filters change
  useEffect(() => {
    if (startDate && endDate && studentId) {
      fetchReport();
    }
  }, [startDate, endDate, studentId]);

  const fetchReport = async () => {
    setLoading(true);
    
    // Build query params
    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);

    const res = await apiClient<StudentLogReportResponse>(`/students/${studentId}/attendance-log?${params.toString()}`);
    if (res.success && res.data) {
      setData(res.data);
    } else {
      setData(null);
    }
    setLoading(false);
  };

  const chartData = data ? [
    { name: t("profileLog.statusAttended"), value: data.summary.attended, color: "#10b981" },
    { name: t("profileLog.statusMissed"), value: data.summary.missed, color: "#ef4444" }
  ] : [];

  return (
    <div className="space-y-6">
      {/* Filters Form */}
      <div className="bg-surface rounded-2xl p-6 shadow-sm border border-outline-variant">
        <h3 className="text-lg font-bold text-on-surface mb-4">{t("profileLog.filters")}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-on-surface mb-1">{t("profileLog.startDate")}</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface text-on-surface focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-on-surface mb-1">{t("profileLog.endDate")}</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface text-on-surface focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm"
            />
          </div>
        </div>
      </div>

      {loading && (
        <div className="py-12 flex justify-center">
          <span className="material-symbols-outlined text-primary text-4xl animate-spin">refresh</span>
        </div>
      )}

      {!loading && data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface rounded-2xl p-6 shadow-sm border border-outline-variant border-t-4 border-t-success">
              <div className="text-sm font-bold uppercase tracking-widest text-success mb-2">
                {t("profileLog.attendedDays")}
              </div>
              <div className="text-4xl font-black text-on-surface">
                {data.summary.attended}
              </div>
            </div>
            <div className="bg-surface rounded-2xl p-6 shadow-sm border border-outline-variant border-t-4 border-t-error">
              <div className="text-sm font-bold uppercase tracking-widest text-error mb-2">
                {t("profileLog.missedDays")}
              </div>
              <div className="text-4xl font-black text-on-surface">
                {data.summary.missed}
              </div>
            </div>
            <div className="bg-surface rounded-2xl p-6 shadow-sm border border-outline-variant border-t-4 border-t-primary">
              <div className="text-sm font-bold uppercase tracking-widest text-primary mb-2">
                {t("profileLog.overallRate")}
              </div>
              <div className="text-4xl font-black text-on-surface">
                {data.summary.overall_rate}%
              </div>
              <div className="mt-2 text-xs font-medium text-outline-variant">{t("profileLog.acrossDays").replace("{days}", data.summary.period_days.toString())}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart */}
            <div className="bg-surface rounded-2xl p-6 shadow-sm border border-outline-variant h-[350px] flex flex-col col-span-1 lg:col-span-1">
              <h3 className="text-lg font-bold text-on-surface mb-2">{t("profileLog.distTitle")}</h3>
              <div className="flex-grow min-h-0">
                {(data.summary.attended === 0 && data.summary.missed === 0) ? (
                  <div className="h-full flex items-center justify-center text-outline-variant">{t("profileLog.noData")}</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="bg-surface rounded-2xl p-6 shadow-sm border border-outline-variant col-span-1 lg:col-span-2 flex flex-col items-center justify-center text-center">
                <span className="material-symbols-outlined text-6xl text-primary/50 mb-4">school</span>
                <h3 className="text-lg font-bold text-on-surface mb-2">{t("profileLog.activeTitle")}</h3>
                <p className="text-on-surface-variant max-w-md">
                  {t("profileLog.activeDesc1")}
                  <span className="font-bold"> {data.summary.period_days}</span> {t("profileLog.activeDesc2")}
                </p>
            </div>
          </div>

          {/* Student Log Table */}
          <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant overflow-hidden">
            <div className="p-6 border-b border-outline-variant bg-surface-container-lowest flex justify-between items-center">
              <h3 className="text-lg font-bold text-on-surface">{t("profileLog.tableTitle")}</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-outline-variant hover:bg-surface-variant/30 transition-colors text-sm font-semibold"
                >
                  <span className="material-symbols-outlined text-lg">sort</span>
                  Sort {sortOrder === "asc" ? "Oldest First" : "Newest First"}
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant text-sm border-b border-outline-variant">
                    <th className="py-4 px-6 font-semibold">{t("profileLog.colDay")}</th>
                    <th className="py-4 px-6 font-semibold">{t("profileLog.colLocation")}</th>
                    <th className="py-4 px-6 font-semibold">{t("profileLog.colTime")}</th>
                    <th className="py-4 px-6 font-semibold">{t("profileLog.colStatus")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant text-sm">
                  {[...data.logs]
                    .sort((a, b) => {
                      const timeA = new Date(a.day).getTime();
                      const timeB = new Date(b.day).getTime();
                      return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
                    })
                    .map((log, i) => (
                      <tr key={i} className="hover:bg-surface-container-lowest transition-colors">
                        <td className="px-6 py-4 text-on-surface-variant">{log.day}</td>
                        <td className="px-6 py-4 text-on-surface-variant">{log.building_name} - {log.room_number}</td>
                        <td className="px-6 py-4 text-on-surface-variant font-mono">
                          {log.attendance_time 
                            ? new Date(log.attendance_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase()
                            : "____"}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
                            log.status === "attended" 
                              ? 'bg-success/10 text-success' 
                              : 'bg-error/10 text-error'
                          }`}>
                            {log.status === "attended" ? t("profileLog.statusAttended") : t("profileLog.statusMissed")}
                          </span>
                        </td>
                      </tr>
                    ))
                  }
                  {data.logs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-on-surface-variant">
                        {t("profileLog.noRecords")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
