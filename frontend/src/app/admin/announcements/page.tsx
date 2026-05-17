"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/i18n/useTranslation";
import { apiClient } from "@/services/api";

export default function AdminAnnouncementsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [isMounted, setIsMounted] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [targetRole, setTargetRole] = useState("student");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState<{ announcement_id: number; published_at: string } | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("user_role");
    if (!token) router.push("/auth");
    else if (role !== "admin") router.push("/dashboard");
  }, [router]);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setIsSubmitting(true);
    setSuccessResult(null);

    const res = await apiClient<{ announcement_id: number; published_at: string }>("/admin/announcements", {
      method: "POST",
      body: JSON.stringify({ title: title.trim(), content: content.trim(), target_role: targetRole }),
    });

    if (res.success && res.data) {
      setSuccessResult(res.data);
      setTitle("");
      setContent("");
    } else {
      alert(res.error || "Failed to publish announcement.");
    }
    setIsSubmitting(false);
  };

  if (!isMounted) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-full bg-primary-container text-primary flex items-center justify-center shadow-soft">
          <span className="material-symbols-outlined text-2xl">campaign</span>
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-primary font-headline">Publish Announcement</h1>
          <p className="text-sm text-on-surface-variant">Broadcast important updates to students and staff.</p>
        </div>
      </div>

      <div className="bg-white shadow-soft rounded-2xl p-8 border border-transparent">
        {successResult && (
          <div className="mb-6 p-4 rounded-lg bg-emerald-50 text-emerald-800 text-sm font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">check_circle</span>
            Announcement #{successResult.announcement_id} published at {new Date(successResult.published_at).toLocaleString()}
          </div>
        )}

        <form onSubmit={handlePublish} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-on-surface mb-2">Title</label>
            <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Announcement title..." className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
          </div>

          <div>
            <label className="block text-sm font-bold text-on-surface mb-2">Content</label>
            <textarea required value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write your announcement here..." rows={6} className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none" />
          </div>

          <div>
            <label className="block text-sm font-bold text-on-surface mb-2">Target Audience</label>
            <select value={targetRole} onChange={(e) => setTargetRole(e.target.value)} className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all">
              <option value="student">Students Only</option>
              <option value="admin">Admins Only</option>
              <option value="all">Everyone</option>
            </select>
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full bg-primary text-white rounded-xl py-4 font-bold tracking-wide hover:opacity-90 transition-opacity disabled:opacity-70 flex justify-center items-center gap-2 shadow-soft">
            {isSubmitting ? <span className="material-symbols-outlined animate-spin">refresh</span> : <span className="material-symbols-outlined">send</span>}
            Publish Announcement
          </button>
        </form>
      </div>
    </div>
  );
}
