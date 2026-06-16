"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/i18n/useTranslation";
import { apiClient } from "@/services/api";

export default function AdminLeasesPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [isMounted, setIsMounted] = useState(false);
  const [leases, setLeases] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Status Filter: "all", "active" (signed & pending_signature), "expired" (expired)
  const [statusFilter, setStatusFilter] = useState("all");

  // Issue Lease Modal State
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [searchStudentName, setSearchStudentName] = useState("");
  const [searchResults, setSearchResults] = useState<{student_id: number; name: string}[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [selectedStudent, setSelectedStudent] = useState<{student_id: number; name: string} | null>(null);
  const [allocationId, setAllocationId] = useState<number | null>(null);
  const [expiresAt, setExpiresAt] = useState("");
  const [isIssuing, setIsIssuing] = useState(false);
  const [issueError, setIssueError] = useState<string | null>(null);
  
  // Action state
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("user_role");
    if (!token) router.push("/auth");
    else if (role !== "admin") router.push("/dashboard");
    else fetchLeases();
  }, [router]);

  const fetchLeases = async () => {
    setIsLoading(true);
    const res = await apiClient<{items: any[]}>("/admin/contracts/leases");
    if (res.success && res.data) {
      setLeases(res.data.items);
    }
    setIsLoading(false);
  };

  // Autocomplete fetch effect for student search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchStudentName.length >= 2 && showDropdown) {
        setIsSearching(true);
        const res = await apiClient<{students: {student_id: number; name: string}[]}>(`/admin/students/search?q=${encodeURIComponent(searchStudentName)}`);
        if (res.success && res.data) {
          setSearchResults(res.data.students);
        } else {
          setSearchResults([]);
        }
        setIsSearching(false);
      } else if (searchStudentName.length < 2) {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchStudentName, showDropdown]);

  // When admin selects a student, fetch their active allocation
  useEffect(() => {
    const fetchAlloc = async () => {
      if (selectedStudent) {
        setIssueError(null);
        setAllocationId(null);
        const res = await apiClient<{items: any[]}>(`/admin/allocations?student_id=${selectedStudent.student_id}`);
        if (res.success && res.data && res.data.items.length > 0) {
          // Find an assigned allocation
          const assigned = res.data.items.find(a => a.status === "assigned");
          if (assigned) {
            setAllocationId(assigned.allocation_id);
          } else {
            setIssueError("Student has allocations, but none are currently 'assigned'.");
          }
        } else {
          setIssueError("Student does not have any allocations.");
        }
      }
    };
    fetchAlloc();
  }, [selectedStudent]);

  const handleSelectStudent = (student: {student_id: number; name: string}) => {
    setSearchStudentName(student.name);
    setSelectedStudent(student);
    setShowDropdown(false);
  };

  const handleIssueLease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocationId) return;
    
    setIsIssuing(true);
    setIssueError(null);
    
    const payload: any = { allocation_id: allocationId };
    if (expiresAt) payload.expires_at = new Date(expiresAt).toISOString();

    const res = await apiClient<any>("/admin/contracts/leases", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (res.success) {
      setShowIssueModal(false);
      setSearchStudentName("");
      setSelectedStudent(null);
      setAllocationId(null);
      setExpiresAt("");
      fetchLeases();
    } else {
      setIssueError(res.error || "Failed to issue lease.");
    }
    setIsIssuing(false);
  };

  const handleRevoke = async (leaseId: number) => {
    const confirmRevoke = window.confirm("Are you sure you want to revoke this lease? This will mark it as expired.");
    if (!confirmRevoke) return;
    
    setActionLoadingId(leaseId);
    const res = await apiClient<any>(`/admin/contracts/leases/${leaseId}/expire`, { method: "POST" });
    if (res.success) {
      fetchLeases();
    } else {
      alert("Failed to revoke lease: " + res.error);
    }
    setActionLoadingId(null);
  };

  const filteredLeases = useMemo(() => {
    if (statusFilter === "active") {
      return leases.filter(l => l.status === "signed" || l.status === "pending_signature");
    } else if (statusFilter === "expired") {
      return leases.filter(l => l.status === "expired");
    }
    return leases;
  }, [leases, statusFilter]);

  if (!isMounted) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary-container text-white flex items-center justify-center shadow-soft">
            <span className="material-symbols-outlined text-2xl">contract</span>
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-primary font-headline">Leases</h1>
            <p className="text-sm text-on-surface-variant">Manage and issue housing contracts</p>
          </div>
        </div>
        <button 
          onClick={() => setShowIssueModal(true)}
          className="bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 shadow-soft transition-all"
        >
          <span className="material-symbols-outlined">add_circle</span>
          Issue New Lease
        </button>
      </div>

      {/* Filters */}
      <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-soft flex items-center gap-4 border border-outline-variant/30">
        <label className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">Filter By Status:</label>
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white border-2 border-outline-variant rounded-xl px-4 py-2 text-sm font-semibold focus:border-primary outline-none"
        >
          <option value="all">All Leases</option>
          <option value="active">Active (Signed / Pending)</option>
          <option value="expired">Expired / Revoked</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="py-12 flex justify-center">
          <span className="material-symbols-outlined text-primary text-4xl animate-spin">refresh</span>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-soft overflow-hidden border border-outline-variant/30">
          {filteredLeases.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl mb-2 opacity-50">description</span>
              <p className="font-semibold">No leases found matching your filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-surface-container-lowest border-b-2 border-outline-variant/30">
                  <tr>
                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-on-surface-variant">Lease ID</th>
                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-on-surface-variant">Student</th>
                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-on-surface-variant">Room</th>
                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-on-surface-variant">Status</th>
                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-on-surface-variant">Dates</th>
                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-on-surface-variant text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {filteredLeases.map((l) => (
                    <tr key={l.lease_id} className="hover:bg-surface-container-lowest/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-on-surface">#{l.lease_id}</td>
                      <td className="px-6 py-4">
                        <div 
                          className="font-bold text-primary hover:underline cursor-pointer"
                          onClick={() => router.push(`/admin/students?id=${l.student_id}`)}
                        >
                          {l.student_name}
                        </div>
                        <div className="text-xs text-on-surface-variant">ID: {l.student_id}</div>
                      </td>
                      <td className="px-6 py-4">
                        {l.room_number ? (
                          <>
                            <div className="font-bold text-on-surface">Room {l.room_number}</div>
                            <div className="text-xs text-on-surface-variant truncate max-w-[150px]">{l.building_name}</div>
                          </>
                        ) : (
                          <span className="text-xs text-on-surface-variant italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${
                          l.status === 'signed' ? 'bg-emerald-50 text-emerald-800' :
                          l.status === 'pending_signature' ? 'bg-amber-50 text-amber-800' :
                          'bg-error-container/30 text-on-error-container'
                        }`}>
                          {l.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-on-surface-variant">
                        <div><span className="font-semibold text-on-surface">Issued:</span> {new Date(l.issued_at).toLocaleDateString()}</div>
                        {l.expires_at && <div><span className="font-semibold text-on-surface">Expires:</span> {new Date(l.expires_at).toLocaleDateString()}</div>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {(l.status === "signed" || l.status === "pending_signature") && (
                          <button
                            onClick={() => handleRevoke(l.lease_id)}
                            disabled={actionLoadingId === l.lease_id}
                            className="bg-error/10 text-error hover:bg-error/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                          >
                            {actionLoadingId === l.lease_id ? "..." : "Revoke"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Issue Lease Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-on-surface">Issue New Lease</h3>
              <button onClick={() => setShowIssueModal(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleIssueLease} className="space-y-5">
              
              <div className="relative">
                <label className="block text-xs font-bold uppercase tracking-widest text-outline-variant mb-1">Search Student</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline-variant">search</span>
                  <input
                    type="text"
                    placeholder="Type at least 2 characters..."
                    value={searchStudentName}
                    onFocus={() => setShowDropdown(true)}
                    onChange={(e) => {
                      setSearchStudentName(e.target.value);
                      setShowDropdown(true);
                      if (selectedStudent) {
                        setSelectedStudent(null);
                        setAllocationId(null);
                      }
                    }}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border-2 border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary outline-none transition-all"
                  />
                </div>
                {showDropdown && (searchStudentName.length >= 2) && (
                  <div className="absolute z-50 w-full mt-1 bg-white border-2 border-outline-variant rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {isSearching ? (
                      <div className="p-3 text-sm text-on-surface-variant text-center">Searching...</div>
                    ) : searchResults.length > 0 ? (
                      searchResults.map(s => (
                        <div 
                          key={s.student_id}
                          className="p-3 text-sm text-on-surface hover:bg-primary-container hover:text-on-primary-container cursor-pointer border-b border-outline-variant/30 last:border-0"
                          onClick={() => handleSelectStudent(s)}
                        >
                          <div className="font-bold">{s.name}</div>
                          <div className="text-xs opacity-80">ID: {s.student_id}</div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-sm text-on-surface-variant text-center">No students found</div>
                    )}
                  </div>
                )}
              </div>

              {selectedStudent && (
                <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30">
                  <div className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Allocation Status</div>
                  {allocationId ? (
                    <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                      <span className="material-symbols-outlined text-lg">check_circle</span>
                      Active Allocation Found (ID: {allocationId})
                    </div>
                  ) : issueError ? (
                    <div className="flex items-center gap-2 text-error font-bold text-sm">
                      <span className="material-symbols-outlined text-lg">error</span>
                      {issueError}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-on-surface-variant text-sm">
                      <span className="material-symbols-outlined animate-spin text-lg">refresh</span>
                      Checking allocation...
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-outline-variant mb-1">Expiration Date (Optional)</label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl border-2 border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary outline-none transition-all"
                />
              </div>

              {issueError && allocationId && (
                <div className="p-3 bg-error-container/30 text-error rounded-xl text-sm font-semibold">
                  {issueError}
                </div>
              )}

              <button
                type="submit"
                disabled={!allocationId || isIssuing}
                className="w-full py-3 rounded-xl font-bold bg-primary text-white hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isIssuing ? <span className="material-symbols-outlined animate-spin text-sm">refresh</span> : null}
                {isIssuing ? "Issuing..." : "Issue Lease"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
