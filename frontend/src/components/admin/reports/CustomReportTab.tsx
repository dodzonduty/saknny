"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/services/api";
import { MultiSelectTags } from "@/components/common/MultiSelectTags";
import { exportToCSV, exportToPDF } from "@/utils/exportUtils";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from "recharts";

interface Option {
  label: string;
  value: string;
}

interface CustomReportResponse {
  summary: {
    total_students: number;
    overall_rate: number;
  };
  students: {
    student_id: number;
    student_name: string;
    building_name: string;
    room_number: string;
    attended_days: number;
    missed_days: number;
  }[];
  daily_trend: {
    day: string;
    attended: number;
    missed: number;
  }[];
}

import { useTranslation } from "@/i18n/useTranslation";

export const CustomReportTab: React.FC = () => {
  const router = useRouter();
  const { t } = useTranslation();

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedStudents, setSelectedStudents] = useState<Option[]>([]);
  const [selectedBuildings, setSelectedBuildings] = useState<Option[]>([]);
  const [selectedRooms, setSelectedRooms] = useState<Option[]>([]);
  
  const [buildingOptions, setBuildingOptions] = useState<Option[]>([]);
  const [allRooms, setAllRooms] = useState<any[]>([]);

  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<CustomReportResponse | null>(null);

  // Initialize dates
  useEffect(() => {
    const today = new Date();
    setEndDate(today.toISOString().split('T')[0]);
    
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    setStartDate(firstDay.toISOString().split('T')[0]);
  }, []);

  // Fetch catalog data for dropdowns
  useEffect(() => {
    const fetchCatalog = async () => {
      const bRes = await apiClient<any>(`/catalog/buildings`);
      if (bRes.success && bRes.data) {
        setBuildingOptions(bRes.data.items.map((b: any) => ({
          label: b.building_name,
          value: b.building_name
        })));
      }
      
      const rRes = await apiClient<any>(`/catalog/rooms`);
      if (rRes.success && rRes.data) {
        setAllRooms(rRes.data.items);
      }
    };
    fetchCatalog();
  }, []);

  // Fetch report when filters change
  useEffect(() => {
    if (startDate && endDate) {
      fetchReport();
    }
  }, [startDate, endDate, selectedStudents, selectedBuildings, selectedRooms]);

  const fetchReport = async () => {
    setLoading(true);
    
    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    
    selectedStudents.forEach(s => params.append("student_ids", s.value));
    selectedBuildings.forEach(b => params.append("building_names", b.value));
    selectedRooms.forEach(r => params.append("room_numbers", r.value));

    const res = await apiClient<CustomReportResponse>(`/admin/reports/custom?${params.toString()}`);
    if (res.success && res.data) {
      setData(res.data);
    } else {
      setData(null);
    }
    setLoading(false);
  };

  const searchStudents = async (q: string) => {
    const res = await apiClient<any>(`/admin/students/search?q=${q}`);
    if (res.success && res.data) {
      return res.data.students.map((s: any) => ({
        label: `${s.name} (ID: ${s.student_id})`,
        value: s.student_id.toString()
      }));
    }
    return [];
  };

  // Compute room options based on selected buildings
  // We need to map building_name to dorm_id to filter rooms
  // Actually, wait, we don't have dorm_id in the buildingOptions value, but we can just use the buildingOptions state 
  // Let's re-fetch or map it. Wait, `allRooms` has `dorm_id`. 
  // We need the mapping from `building_name` to `dorm_id`.
  // Since we only store building_name in `selectedBuildings`, let's just let room options show rooms that belong to the selected building's dorm_id.
  // We can fetch `/catalog/buildings` again or keep it in a ref. 
  // For simplicity, let's just let the user see all room numbers if they start typing, or we map it if we stored the raw list.
  // Actually, I'll store `allBuildings` raw list.
  const [allBuildings, setAllBuildings] = useState<any[]>([]);
  useEffect(() => {
    const fetchBuildings = async () => {
      const bRes = await apiClient<any>(`/catalog/buildings`);
      if (bRes.success && bRes.data) {
        setAllBuildings(bRes.data.items);
        setBuildingOptions(bRes.data.items.map((b: any) => ({
          label: b.building_name,
          value: b.building_name
        })));
      }
    };
    fetchBuildings();
  }, []);

  const getAvailableRoomOptions = () => {
    if (selectedBuildings.length === 0) return [];
    
    // Get dorm_ids for selected building names
    const selectedDormIds = selectedBuildings.map(sb => {
      const b = allBuildings.find(ab => ab.building_name === sb.value);
      return b ? b.dorm_id : null;
    }).filter(Boolean);

    const filteredRooms = allRooms.filter(r => selectedDormIds.includes(r.dorm_id));
    
    // Remove duplicates if room numbers are shared, but usually they are unique per building
    return Array.from(new Set(filteredRooms.map(r => r.room_number))).map(rn => ({
      label: rn,
      value: rn
    }));
  };

  const roomOptions = getAvailableRoomOptions();

  const handleExportCSV = () => {
    if (!data) return;
    const headers = ["Student Name", "Building", "Room", "Attended Days", "Missed Days"];
    const tableData = data.students.map(student => [
      student.student_name,
      student.building_name,
      student.room_number,
      student.attended_days,
      student.missed_days
    ]);
    exportToCSV(`Custom_Report_${startDate}_to_${endDate}`, headers, tableData);
  };

  const handleExportPDF = () => {
    if (!data) return;
    const headers = ["Student Name", "Building", "Room", "Attended Days", "Missed Days"];
    const tableData = data.students.map(student => [
      student.student_name,
      student.building_name,
      student.room_number,
      student.attended_days,
      student.missed_days
    ]);
    exportToPDF(`Custom_Report_${startDate}_to_${endDate}`, `Custom Attendance Report (${startDate} to ${endDate})`, headers, tableData);
  };

  // Sort students for the chart to show top 10 most missed
  const topMissedStudents = data ? [...data.students].sort((a, b) => b.missed_days - a.missed_days).slice(0, 10) : [];

  return (
    <div className="space-y-6">
      <div className="bg-surface rounded-2xl p-6 shadow-sm border border-outline-variant">
        <h3 className="text-lg font-bold text-on-surface mb-4">{t("customReport.filtersTitle")}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex gap-4">
            <div className="w-1/2">
              <label className="block text-sm font-semibold text-on-surface mb-1">{t("customReport.startDate")}</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface text-on-surface focus:ring-2 focus:ring-primary outline-none transition-all text-sm"
              />
            </div>
            <div className="w-1/2">
              <label className="block text-sm font-semibold text-on-surface mb-1">{t("customReport.endDate")}</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface text-on-surface focus:ring-2 focus:ring-primary outline-none transition-all text-sm"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-on-surface mb-1">{t("customReport.studentSearch")}</label>
            <MultiSelectTags 
              selected={selectedStudents}
              onChange={setSelectedStudents}
              onSearch={searchStudents}
              placeholder={t("customReport.studentSearchPlaceholder")}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-on-surface mb-1">{t("customReport.buildings")}</label>
            <MultiSelectTags 
              selected={selectedBuildings}
              onChange={(vals) => {
                setSelectedBuildings(vals);
                // Clear rooms if buildings are cleared
                if (vals.length === 0) setSelectedRooms([]);
              }}
              options={buildingOptions}
              placeholder={t("customReport.buildingsPlaceholder")}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-on-surface mb-1">{t("customReport.rooms")}</label>
            <MultiSelectTags 
              selected={selectedRooms}
              onChange={setSelectedRooms}
              options={roomOptions}
              placeholder={selectedBuildings.length === 0 ? t("customReport.roomsPlaceholderEmpty") : t("customReport.roomsPlaceholder")}
              disabled={selectedBuildings.length === 0}
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-surface rounded-2xl p-6 shadow-sm border border-outline-variant h-[400px] flex flex-col">
              <h3 className="text-lg font-bold text-on-surface mb-2">{t("customReport.trendTitle")}</h3>
              <p className="text-sm text-on-surface-variant mb-4">{t("customReport.trendDesc")}</p>
              <div className="flex-grow min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart 
                    data={data.daily_trend}
                    onClick={(e) => {
                      if (e && e.activeTooltipIndex !== undefined) {
                        const clickedDay = data.daily_trend[e.activeTooltipIndex]?.day;
                        if (clickedDay) {
                          setStartDate(clickedDay);
                          setEndDate(clickedDay);
                        }
                      }
                    }}
                    style={{ cursor: "pointer", outline: "none" }}
                  >
                    <defs>
                      <linearGradient id="colorAttended" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorMissed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="day" 
                      tickFormatter={(val) => new Date(val).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      labelFormatter={(val) => new Date(val).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="attended" name={t("dailyReport.attended")} stroke="#10b981" fillOpacity={1} fill="url(#colorAttended)" />
                    <Area type="monotone" dataKey="missed" name={t("dailyReport.missed")} stroke="#ef4444" fillOpacity={1} fill="url(#colorMissed)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-surface rounded-2xl p-6 shadow-sm border border-outline-variant h-[400px] flex flex-col">
              <h3 className="text-lg font-bold text-on-surface mb-2">{t("customReport.topMissedTitle")}</h3>
              <p className="text-sm text-on-surface-variant mb-4">{t("customReport.topMissedDesc")}</p>
              <div className="flex-grow min-h-0">
                {topMissedStudents.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-outline-variant">{t("customReport.noData")}</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topMissedStudents} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                      <XAxis type="number" tick={{ fontSize: 12, fill: '#6b7280' }} />
                      <YAxis 
                        dataKey="student_name" 
                        type="category" 
                        tick={{ fontSize: 11, fill: '#374151' }}
                        width={100}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Legend />
                      <Bar dataKey="attended_days" name={t("dailyReport.attended")} stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} barSize={20} />
                      <Bar dataKey="missed_days" name={t("dailyReport.missed")} stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant overflow-hidden mt-6">
            <div className="p-6 border-b border-outline-variant flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-on-surface">{t("customReport.summariesTitle")}</h3>
                <div className="text-sm text-on-surface-variant font-medium mt-1">
                  {t("customReport.overallRate")} <span className="text-primary font-bold">{data.summary.overall_rate}%</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleExportCSV} className="px-4 py-2 bg-surface-container hover:bg-surface-container-high text-sm font-semibold rounded-lg border border-outline-variant transition-colors flex items-center gap-1 text-on-surface">
                  <span className="material-symbols-outlined text-sm">table_view</span> {t("dailyReport.excel")}
                </button>
                <button onClick={handleExportPDF} className="px-4 py-2 bg-surface-container hover:bg-surface-container-high text-sm font-semibold rounded-lg border border-outline-variant transition-colors flex items-center gap-1 text-on-surface">
                  <span className="material-symbols-outlined text-sm">picture_as_pdf</span> {t("dailyReport.pdf")}
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-surface-container-low text-on-surface-variant text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-semibold">{t("customReport.colStudentName")}</th>
                    <th className="px-6 py-4 font-semibold">{t("dailyReport.colBuilding")}</th>
                    <th className="px-6 py-4 font-semibold">{t("dailyReport.colRoom")}</th>
                    <th className="px-6 py-4 font-semibold text-center">{t("customReport.colAttendedDays")}</th>
                    <th className="px-6 py-4 font-semibold text-center">{t("customReport.colMissedDays")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant text-sm">
                  {data.students.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-outline-variant">
                        {t("customReport.noMatch")}
                      </td>
                    </tr>
                  ) : (
                    data.students.map((student, i) => (
                      <tr key={i} className="hover:bg-surface-container-lowest transition-colors">
                        <td className="px-6 py-4 font-medium text-primary hover:underline cursor-pointer"
                            onClick={() => router.push(`/admin/reports?tab=student-log&studentId=${student.student_id}&studentName=${encodeURIComponent(student.student_name)}`)}>
                          {student.student_name}
                        </td>
                        <td className="px-6 py-4 text-on-surface-variant">{student.building_name}</td>
                        <td className="px-6 py-4 text-on-surface-variant">{student.room_number}</td>
                        <td className="px-6 py-4 text-center font-bold text-success">{student.attended_days}</td>
                        <td className="px-6 py-4 text-center font-bold text-error">{student.missed_days}</td>
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
