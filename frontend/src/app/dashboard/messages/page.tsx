"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardNavbar } from "@/components/dashboard/DashboardNavbar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { useTranslation } from "@/i18n/useTranslation";
import { apiClient } from "@/services/api";

interface Message {
  message_id: number;
  sender_role: string;
  sender_id: number;
  recipient_role: string;
  recipient_id: number;
  body: string;
  created_at: string;
}

export default function MessagesPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAllocated, setIsAllocated] = useState<boolean | null>(null);

  const [recipientRole, setRecipientRole] = useState("admin");
  const [recipientId, setRecipientId] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);

  const [threadWithRole, setThreadWithRole] = useState<string | null>(null);
  const [threadWithId, setThreadWithId] = useState<number | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("user_role");
    if (!token) router.push("/auth");
    else if (role === "admin") router.push("/admin");
    else {
      checkAllocation().then(allocated => {
        if (allocated) fetchMessages();
        else setLoading(false);
      });
    }
  }, [router]);

  const checkAllocation = async () => {
    const res = await apiClient<any>("/allocations/me");
    const allocated = !!(res.success && res.data && res.data.allocation);
    setIsAllocated(allocated);
    return allocated;
  };

  const fetchMessages = async (withRole?: string, withId?: number) => {
    setLoading(true);
    let url = "/messages";
    if (withRole && withId) url += `?with_role=${withRole}&with_id=${withId}`;
    const res = await apiClient<{ items: Message[] }>(url);
    if (res.success && res.data) setMessages(res.data.items);
    setLoading(false);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() || !recipientId) return;
    setIsSending(true);

    const res = await apiClient<any>("/messages", {
      method: "POST",
      body: JSON.stringify({ recipient_role: recipientRole, recipient_id: parseInt(recipientId), body: body.trim() }),
    });

    if (res.success) {
      setBody("");
      if (threadWithRole && threadWithId) fetchMessages(threadWithRole, threadWithId);
      else fetchMessages();
    } else {
      alert(res.error || "Failed to send message.");
    }
    setIsSending(false);
  };

  const openThread = (role: string, id: number) => {
    setThreadWithRole(role);
    setThreadWithId(id);
    setRecipientRole(role);
    setRecipientId(String(id));
    fetchMessages(role, id);
  };

  const clearThread = () => {
    setThreadWithRole(null);
    setThreadWithId(null);
    fetchMessages();
  };

  if (!isMounted) return null;

  const myRole = "student";
  const myId = parseInt(localStorage.getItem("user_id") || "0");

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      <DashboardNavbar />
      <DashboardSidebar />

      <main className="lg:ms-64 pt-24 pb-12 px-8 flex-grow">
        <div className="max-w-4xl mx-auto space-y-8">

          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-full bg-primary-container text-white flex items-center justify-center shadow-soft">
              <span className="material-symbols-outlined text-2xl">chat</span>
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-primary font-headline">{t("messages.messagesTitle")}</h1>
              <p className="text-sm text-on-surface-variant">{t("messages.messagesDesc")}</p>
            </div>
          </div>

          {isAllocated === false ? (
            <div className="bg-surface rounded-2xl p-12 text-center shadow-sm border border-outline-variant">
              <span className="material-symbols-outlined text-6xl text-error/50">gpp_maybe</span>
              <h3 className="text-xl font-bold text-on-surface mt-4">{t("messages.notAllocated")}</h3>
              <p className="text-on-surface-variant max-w-md mx-auto mt-2">
                {t("messages.mustBeAllocatedDesc")}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Conversation List / All Messages */}
              <div className="lg:col-span-2 bg-white shadow-soft rounded-2xl border border-transparent overflow-hidden">
                <div className="bg-surface-container-lowest border-b-2 border-outline-variant/20 p-4 flex items-center justify-between">
                  <h3 className="font-bold text-on-surface text-sm">
                    {threadWithRole ? `Thread with ${threadWithRole} #${threadWithId}` : t("messages.showAll")}
                  </h3>
                  {threadWithRole && (
                    <button onClick={clearThread} className="text-xs font-bold text-primary hover:underline">{t("messages.showAll")}</button>
                  )}
                </div>

                <div className="max-h-[500px] overflow-y-auto p-4 space-y-3">
                  {loading ? (
                    <div className="py-8 flex justify-center"><span className="material-symbols-outlined text-primary text-3xl animate-spin">refresh</span></div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-8">
                      <span className="material-symbols-outlined text-4xl text-outline-variant mb-2">forum</span>
                      <p className="text-on-surface-variant text-sm">{t("messages.noMessages")}</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMine = msg.sender_role === myRole && msg.sender_id === myId;
                      return (
                        <div key={msg.message_id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${isMine ? "bg-primary text-white rounded-br-sm" : "bg-surface-container-low text-on-surface rounded-bl-sm"}`}>
                            <div className="text-xs font-bold mb-1 opacity-70">
                              {msg.sender_role} #{msg.sender_id}
                            </div>
                            <div className="text-sm">{msg.body}</div>
                            <div className="text-[10px] mt-1 opacity-50 text-right">{new Date(msg.created_at).toLocaleString()}</div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Compose Area */}
              <div className="bg-white shadow-soft rounded-2xl p-6 border border-transparent">
                <h3 className="font-bold text-on-surface mb-4 text-sm">{t("messages.sendMessageButton")}</h3>
                <form onSubmit={handleSend} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-outline-variant uppercase tracking-widest mb-1">To (Role)</label>
                    <select value={recipientRole} onChange={(e) => setRecipientRole(e.target.value)} className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-3 py-2 text-sm focus:border-primary outline-none">
                      <option value="admin">{t("messages.adminLabel")}</option>
                      <option value="student">{t("messages.studentLabel")}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-outline-variant uppercase tracking-widest mb-1">{t("messages.recipientId")}</label>
                    <input type="number" required value={recipientId} onChange={(e) => setRecipientId(e.target.value)} placeholder="e.g. 1" className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-3 py-2 text-sm focus:border-primary outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-outline-variant uppercase tracking-widest mb-1">{t("messages.messagePlaceholder")}</label>
                    <textarea required value={body} onChange={(e) => setBody(e.target.value)} placeholder="..." rows={4} className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-3 py-2 text-sm focus:border-primary outline-none resize-none" />
                  </div>
                  <button type="submit" disabled={isSending} className="w-full bg-primary text-white rounded-xl py-3 font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
                    {isSending ? <span className="material-symbols-outlined animate-spin text-[18px]">refresh</span> : <span className="material-symbols-outlined text-[18px]">send</span>}
                    {t("messages.sendMessageButton")}
                  </button>
                </form>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
