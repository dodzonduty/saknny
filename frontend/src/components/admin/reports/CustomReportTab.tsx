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

interface CustomReportResponse {
  summary: {
    total_possible: number;
    attended: number;
    missed: number;
    overall_rate: number;
  };
  student_breakdown?: {
    student_id: number;
    name: string | null;
    attended_days: number;
    missed_days: number;
    total_days: number;
  };
}

export const CustomReportTab: React.FC = () => {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [studentId, setStudentId] = useState<string>("");
  const [dormId, setDormId] = useState<string>("");
  const [roomId, setRoomId] = useState<string>("");
  
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<CustomReportResponse | null>(null);

  // Initialize dates
  useEffect(() => {
    const today = new Date();
    setEndDate(today.toISOString().split('T')[0]);
    
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    setStartDate(firstDay.toISOString().split('T')[0]);
  }, []);

  // Fetch report whenever filters change
  useEffect(() => {
    if (startDate && endDate) {
      fetchReport();
    }
  }, [startDate, endDate, studentId, dormId, roomId]);

  const fetchReport = async () => {
    setLoading(true);
    
    // Build query params
    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    if (studentId) params.append("student_id", studentId);
    if (dormId) params.append("dorm_id", dormId);
    if (roomId) params.append("room_id", roomId);

    const res = await apiClient<CustomReportResponse>(`/admin/reports/custom?${params.toString()}`);
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
      {/* Filters Multi-select form */}
      <div className="bg-surface rounded-2xl p-6 shadow-sm border border-outline-variant">
        <h3 className="text-lg font-bold text-on-surface mb-4">Report Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
          <div>
            <label className="block text-sm font-semibold text-on-surface mb-1">Student ID (Opt)</label>
            <input
              type="number"
              placeholder="e.g. 1001"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface text-on-surface focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-on-surface mb-1">Building ID (Opt)</label>
            <input
              type="number"
              placeholder="e.g. 1"
              value={dormId}
              onChange={(e) => setDormId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface text-on-surface focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-on-surface mb-1">Room ID (Opt)</label>
            <input
              type="number"
              placeholder="e.g. 101"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-surface rounded-2xl p-6 shadow-sm border border-outline-variant">
              <div className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                Total Possible Days
              </div>
              <div className="text-4xl font-black text-on-surface">
                {data.summary.total_possible}
              </div>
            </div>
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
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart */}
            <div className="bg-surface rounded-2xl p-6 shadow-sm border border-outline-variant h-[350px] flex flex-col col-span-1 lg:col-span-1">
              <h3 className="text-lg font-bold text-on-surface mb-2">Attendance Distribution</h3>
              <div className="flex-grow min-h-0">
                {data.summary.total_possible === 0 ? (
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

            {/* Student Breakdown (if filtered by student) */}
            {data.student_breakdown ? (
              <div className="bg-surface rounded-2xl p-6 shadow-sm border border-outline-variant col-span-1 lg:col-span-2">
                <h3 className="text-lg font-bold text-on-surface mb-6">Student Breakdown</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-surface-container-low p-4 rounded-xl">
                    <div className="text-xs font-bold text-outline-variant uppercase tracking-wider mb-1">Student ID</div>
                    <div className="text-lg font-bold text-on-surface">{data.student_breakdown.student_id}</div>
                  </div>
                  <div className="bg-surface-container-low p-4 rounded-xl">
                    <div className="text-xs font-bold text-outline-variant uppercase tracking-wider mb-1">Name</div>
                    <div className="text-lg font-bold text-on-surface">{data.student_breakdown.name || "Unknown"}</div>
                  </div>
                  <div className="bg-surface-container-low p-4 rounded-xl border border-success-container">
                    <div className="text-xs font-bold text-success uppercase tracking-wider mb-1">Attended Days</div>
                    <div className="text-2xl font-black text-on-surface">{data.student_breakdown.attended_days}</div>
                  </div>
                  <div className="bg-surface-container-low p-4 rounded-xl border border-error-container">
                    <div className="text-xs font-bold text-error uppercase tracking-wider mb-1">Missed Days</div>
                    <div className="text-2xl font-black text-on-surface">{data.student_breakdown.missed_days}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-surface rounded-2xl p-6 shadow-sm border border-outline-variant col-span-1 lg:col-span-2 flex flex-col items-center justify-center text-center">
                <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">account_circle</span>
                <h3 className="text-lg font-bold text-on-surface mb-2">Student Breakdown</h3>
                <p className="text-on-surface-variant max-w-sm">
                  Enter a specific Student ID in the filters above to view detailed attendance logs for that student.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
