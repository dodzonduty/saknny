"use client";

import React, { useState, useEffect } from "react";
import { apiClient } from "@/services/api";
import { exportToCSV, exportToPDF } from "@/utils/exportUtils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface DailyReportResponse {
  summary: {
    target_date: string;
    total_allocated: number;
    attended: number;
    missed: number;
  };
  building_rates: {
    dorm_id: number;
    building_name: string;
    total: number;
    attended: number;
    rate: number;
  }[];
  room_rates: {
    room_id: number;
    room_number: string;
    dorm_id: number;
    total: number;
    attended: number;
    rate: number;
  }[];
  students: {
    student_id: number;
    student_name: string;
    room_id: number;
    room_number: string;
    dorm_id: number;
    building_name: string;
    status: "attended" | "missed";
    attendance_time?: string | null;
  }[];
}

export const DailyReportTab: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<DailyReportResponse | null>(null);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    const res = await apiClient<DailyReportResponse>(`/admin/reports/daily`);
    if (res.success && res.data) {
      setData(res.data);
    } else {
      setData(null);
    }
    setLoading(false);
  };

  const handleExportCSV = () => {
    if (!data) return;
    const headers = ["Student Name", "Student ID", "Building", "Room", "Time", "Status"];
    const tableData = data.students.map(student => [
      student.student_name,
      student.student_id,
      student.building_name,
      student.room_number,
      student.attendance_time ? new Date(student.attendance_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase() : "____",
      student.status
    ]);
    exportToCSV(`Daily_Report_${data.summary.target_date}`, headers, tableData);
  };

  const handleExportPDF = () => {
    if (!data) return;
    const headers = ["Student Name", "Student ID", "Building", "Room", "Time", "Status"];
    const tableData = data.students.map(student => [
      student.student_name,
      student.student_id,
      student.building_name,
      student.room_number,
      student.attendance_time ? new Date(student.attendance_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase() : "____",
      student.status
    ]);
    exportToPDF(`Daily_Report_${data.summary.target_date}`, `Daily Attendance Report - ${data.summary.target_date}`, headers, tableData);
  };

  return (
    <div className="space-y-6">
      {loading && (
        <div className="py-12 flex justify-center">
          <span className="material-symbols-outlined text-primary text-4xl animate-spin">refresh</span>
        </div>
      )}

      {!loading && data && (
        <>
          <div className="flex items-center justify-between bg-surface rounded-2xl p-6 shadow-sm border border-outline-variant">
            <div>
              <h2 className="text-xl font-bold text-on-surface">Daily Report</h2>
              <p className="text-on-surface-variant text-sm mt-1">
                Displaying attendance for: <span className="font-semibold text-primary">{data.summary.target_date}</span>
              </p>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface rounded-2xl p-6 shadow-sm border border-outline-variant">
              <div className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                Total Students
              </div>
              <div className="text-4xl font-black text-on-surface">
                {data.summary.total_allocated}
              </div>
            </div>
            <div className="bg-surface rounded-2xl p-6 shadow-sm border border-outline-variant border-t-4 border-t-success">
              <div className="text-sm font-bold uppercase tracking-widest text-success mb-2">
                Attended
              </div>
              <div className="text-4xl font-black text-on-surface">
                {data.summary.attended}
              </div>
            </div>
            <div className="bg-surface rounded-2xl p-6 shadow-sm border border-outline-variant border-t-4 border-t-error">
              <div className="text-sm font-bold uppercase tracking-widest text-error mb-2">
                Missed
              </div>
              <div className="text-4xl font-black text-on-surface">
                {data.summary.missed}
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-surface rounded-2xl p-6 shadow-sm border border-outline-variant h-[400px] flex flex-col">
              <h3 className="text-lg font-bold text-on-surface mb-6">Building Attendance Rates (%)</h3>
              {data.building_rates.length === 0 ? (
                <div className="flex-grow flex items-center justify-center text-outline-variant">No building data</div>
              ) : (
                <div className="flex-grow min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.building_rates} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="building_name" tick={{ fontSize: 12 }} interval={0} angle={-45} textAnchor="end" />
                      <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                      <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                      <Bar dataKey="rate" name="Attendance Rate %" radius={[4, 4, 0, 0]}>
                        {data.building_rates.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.rate >= 80 ? '#10b981' : entry.rate >= 50 ? '#f59e0b' : '#ef4444'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="bg-surface rounded-2xl p-6 shadow-sm border border-outline-variant h-[400px] flex flex-col">
              <h3 className="text-lg font-bold text-on-surface mb-6">Room Attendance Rates (%)</h3>
              {data.room_rates.length === 0 ? (
                <div className="flex-grow flex items-center justify-center text-outline-variant">No room data</div>
              ) : (
                <div className="flex-grow min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.room_rates.slice(0, 20)} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="room_number" tick={{ fontSize: 12 }} interval={0} angle={-45} textAnchor="end" />
                      <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                      <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                      <Bar dataKey="rate" name="Attendance Rate %" radius={[4, 4, 0, 0]}>
                        {data.room_rates.slice(0, 20).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.rate >= 80 ? '#10b981' : entry.rate >= 50 ? '#f59e0b' : '#ef4444'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant overflow-hidden">
            <div className="p-6 border-b border-outline-variant flex items-center justify-between">
              <h3 className="text-lg font-bold text-on-surface">Student Attendance Report</h3>
              <div className="flex gap-2">
                <button onClick={handleExportCSV} className="px-4 py-2 bg-surface-container hover:bg-surface-container-high text-sm font-semibold rounded-lg border border-outline-variant transition-colors flex items-center gap-1 text-on-surface">
                  <span className="material-symbols-outlined text-sm">table_view</span> Excel
                </button>
                <button onClick={handleExportPDF} className="px-4 py-2 bg-surface-container hover:bg-surface-container-high text-sm font-semibold rounded-lg border border-outline-variant transition-colors flex items-center gap-1 text-on-surface">
                  <span className="material-symbols-outlined text-sm">picture_as_pdf</span> PDF
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-surface-container-low text-on-surface-variant text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Student</th>
                    <th className="px-6 py-4 font-semibold">ID</th>
                    <th className="px-6 py-4 font-semibold">Building</th>
                    <th className="px-6 py-4 font-semibold">Room</th>
                    <th className="px-6 py-4 font-semibold">Time</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant text-sm">
                  {data.students.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-outline-variant">
                        No students found.
                      </td>
                    </tr>
                  ) : (
                    data.students.map((student, i) => (
                      <tr key={i} className="hover:bg-surface-container-lowest transition-colors">
                        <td className="px-6 py-4 font-medium text-on-surface">{student.student_name}</td>
                        <td className="px-6 py-4 text-on-surface-variant">{student.student_id}</td>
                        <td className="px-6 py-4 text-on-surface-variant">{student.building_name}</td>
                        <td className="px-6 py-4 text-on-surface-variant">{student.room_number}</td>
                        <td className="px-6 py-4 text-on-surface-variant font-mono">
                          {student.attendance_time 
                            ? new Date(student.attendance_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase()
                            : "____"}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-bold rounded-full uppercase tracking-widest ${
                            student.status === "attended" 
                              ? "bg-success-container text-success" 
                              : "bg-error-container text-error"
                          }`}>
                            {student.status}
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
