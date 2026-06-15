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
    { name: "Attended", value: data.summary.attended, color: "#10b981" },
    { name: "Missed", value: data.summary.missed, color: "#ef4444" }
  ] : [];

  return (
    <div className="space-y-6">
      {/* Filters Form */}
      <div className="bg-surface rounded-2xl p-6 shadow-sm border border-outline-variant">
        <h3 className="text-lg font-bold text-on-surface mb-4">Report Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-on-surface mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface text-on-surface focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-on-surface mb-1">End Date</label>
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

      {!loading && data && data.summary.is_allocated === false && (
        <div className="bg-surface rounded-2xl p-8 shadow-sm border border-outline-variant text-center space-y-4">
          <span className="material-symbols-outlined text-6xl text-primary/50">home_work</span>
          <h3 className="text-xl font-bold text-on-surface">Not Allocated</h3>
          <p className="text-on-surface-variant max-w-md mx-auto">
            You have not been allocated a room yet. Your attendance log will become available once you move in.
          </p>
        </div>
      )}

      {!loading && data && data.summary.is_allocated !== false && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface rounded-2xl p-6 shadow-sm border border-outline-variant border-t-4 border-t-success">
              <div className="text-sm font-bold uppercase tracking-widest text-success mb-2">
                Attended Days
              </div>
              <div className="text-4xl font-black text-on-surface">
                {data.summary.attended}
              </div>
            </div>
            <div className="bg-surface rounded-2xl p-6 shadow-sm border border-outline-variant border-t-4 border-t-error">
              <div className="text-sm font-bold uppercase tracking-widest text-error mb-2">
                Missed Days
              </div>
              <div className="text-4xl font-black text-on-surface">
                {data.summary.missed}
              </div>
            </div>
            <div className="bg-surface rounded-2xl p-6 shadow-sm border border-outline-variant border-t-4 border-t-primary">
              <div className="text-sm font-bold uppercase tracking-widest text-primary mb-2">
                Overall Rate
              </div>
              <div className="text-4xl font-black text-on-surface">
                {data.summary.overall_rate}%
              </div>
              <div className="mt-2 text-xs font-medium text-outline-variant">Across {data.summary.period_days} days</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart */}
            <div className="bg-surface rounded-2xl p-6 shadow-sm border border-outline-variant h-[350px] flex flex-col col-span-1 lg:col-span-1">
              <h3 className="text-lg font-bold text-on-surface mb-2">Attendance Distribution</h3>
              <div className="flex-grow min-h-0">
                {(data.summary.attended === 0 && data.summary.missed === 0) ? (
                  <div className="h-full flex items-center justify-center text-outline-variant">No data available</div>
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
                <h3 className="text-lg font-bold text-on-surface mb-2">Student Log Active</h3>
                <p className="text-on-surface-variant max-w-md">
                  This report shows exactly how many days you attended or missed out of the 
                  <span className="font-bold"> {data.summary.period_days} days</span> selected in the filters. 
                  View the detailed log below for a day-by-day breakdown.
                </p>
            </div>
          </div>

          {/* Student Log Table */}
          <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant overflow-hidden">
            <div className="p-6 border-b border-outline-variant flex items-center justify-between">
              <h3 className="text-lg font-bold text-on-surface">Detailed Logs</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-surface-container-low text-on-surface-variant text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Building</th>
                    <th className="px-6 py-4 font-semibold">Room</th>
                    <th 
                      className="px-6 py-4 font-semibold cursor-pointer hover:text-primary transition-colors flex items-center gap-1"
                      onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
                    >
                      Day
                      <span className="material-symbols-outlined text-sm">
                        {sortOrder === "asc" ? "arrow_upward" : "arrow_downward"}
                      </span>
                    </th>
                    <th className="px-6 py-4 font-semibold">Time</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant text-sm">
                  {data.logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-outline-variant">
                        No logs found for this period.
                      </td>
                    </tr>
                  ) : (
                    [...data.logs]
                      .sort((a, b) => {
                        const timeA = new Date(a.day).getTime();
                        const timeB = new Date(b.day).getTime();
                        return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
                      })
                      .map((log, i) => (
                        <tr key={i} className="hover:bg-surface-container-lowest transition-colors">
                          <td className="px-6 py-4 text-on-surface-variant">{log.building_name}</td>
                          <td className="px-6 py-4 text-on-surface-variant">{log.room_number}</td>
                          <td className="px-6 py-4 text-on-surface-variant">{log.day}</td>
                          <td className="px-6 py-4 text-on-surface-variant font-mono">
                            {log.attendance_time 
                              ? new Date(log.attendance_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase()
                              : "____"}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs font-bold rounded-full uppercase tracking-widest ${
                              log.status === "attended" 
                                ? "bg-success-container text-success" 
                                : "bg-error-container text-error"
                            }`}>
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      ))
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
