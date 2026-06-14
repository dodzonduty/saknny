"use client";

import React, { useState } from "react";
import { DailyReportTab } from "@/components/admin/reports/DailyReportTab";
import { StudentLogReportTab } from "@/components/admin/reports/StudentLogReportTab";

export default function AdminReportsPage() {
  const [activeTab, setActiveTab] = useState<"daily" | "student-log">("daily");

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="bg-gradient-to-r from-primary to-blue-800 rounded-2xl p-8 text-white shadow-soft relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-black tracking-tight mb-2 font-headline">
            Attendance Reports
          </h1>
          <p className="text-blue-100 max-w-xl">
            View daily attendance rates across buildings and rooms, or generate custom analytical reports.
          </p>
        </div>
        <span className="material-symbols-outlined absolute -right-4 -bottom-10 text-[180px] text-white/5 pointer-events-none transform -rotate-12">
          bar_chart
        </span>
      </div>

      <div className="flex border-b border-outline-variant">
        <button
          onClick={() => setActiveTab("daily")}
          className={`px-6 py-3 font-semibold text-sm transition-colors relative ${
            activeTab === "daily" ? "text-primary" : "text-on-surface-variant hover:bg-surface-container"
          }`}
        >
          Daily Report
          {activeTab === "daily" && (
            <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("student-log")}
          className={`px-6 py-3 font-semibold text-sm transition-colors relative ${
            activeTab === "student-log" ? "text-primary" : "text-on-surface-variant hover:bg-surface-container"
          }`}
        >
          Student Log Report
          {activeTab === "student-log" && (
            <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full" />
          )}
        </button>
      </div>

      <div className="mt-6">
        {activeTab === "daily" && <DailyReportTab />}
        {activeTab === "student-log" && <StudentLogReportTab />}
      </div>
    </div>
  );
}
