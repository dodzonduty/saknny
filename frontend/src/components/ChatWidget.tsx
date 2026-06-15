"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { apiClient } from "@/services/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
}

interface ChatApiData {
  answer: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

const WELCOME: Message = {
  id: "welcome",
  role: "assistant",
  text: "مرحبًا! أنا مساعد سكني الذكي. يمكنني الإجابة على أسئلتك حول لائحة قواعد وأنظمة الإقامة في المدن الجامعية.\n\nHello! I'm Sakny's AI assistant. Ask me anything about the university housing regulations.",
  timestamp: new Date(),
};

// ── Component ─────────────────────────────────────────────────────────────────

export const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom whenever messages change
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setHasUnread(false);
      // Focus input on open
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, scrollToBottom]);

  const toggleOpen = () => {
    setIsOpen((prev) => !prev);
    if (!isOpen) setHasUnread(false);
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = {
      id: uid(),
      role: "user",
      text: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await apiClient<ChatApiData>("/chatbot/chat", {
        method: "POST",
        body: JSON.stringify({ message: trimmed }),
      });

      const answerText =
        res.success && res.data?.answer
          ? res.data.answer
          : res.error || "حدث خطأ. يرجى المحاولة مرة أخرى.";

      const assistantMsg: Message = {
        id: uid(),
        role: "assistant",
        text: answerText,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (!isOpen) {
        setHasUnread(true);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "assistant",
          text: "حدث خطأ في الاتصال. يرجى التحقق من الشبكة والمحاولة مرة أخرى.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/*
       * ── Floating Trigger Button ──────────────────────────────────────────
       *
       * Positioning rationale:
       *   - bottom-8  (32px) — extra clearance from the viewport bottom edge
       *     so the button sits above any sidebar "New Application" CTA text
       *     that renders near the bottom of the page on dashboard views.
       *   - end-6 (24px) — logical-CSS right/left so RTL is handled correctly.
       *   - z-[200] — well above the sidebar (z-40), the navbar (z-50), and
       *     the chat panel (z-[199]), so nothing clips the trigger.
       *   - pointer-events are not disabled, so the button is always clickable
       *     regardless of panel open state.
       */}
      <button
        id="chat-widget-trigger"
        onClick={toggleOpen}
        aria-label={isOpen ? "Close chat" : "Open housing regulations chat"}
        title="Sakny AI Housing Assistant"
        className={[
          // Position: 32 px from bottom, 24 px from right (logical end)
          "fixed bottom-8 end-6",
          // Stack above everything else
          "z-[200]",
          // Size & shape
          "w-14 h-14 rounded-full",
          // Shadow — uses existing design token
          "shadow-soft-lg",
          // Layout
          "flex items-center justify-center",
          // Smooth transitions
          "transition-all duration-300 ease-out",
          // Accessibility ring
          "focus:outline-none focus-visible:ring-4 focus-visible:ring-accent-yellow/60",
          // Colour states
          isOpen
            ? "bg-primary-container scale-90"
            : "bg-primary hover:scale-110 hover:shadow-2xl active:scale-95",
        ].join(" ")}
      >
        <span className="material-symbols-outlined text-white text-2xl transition-all duration-300">
          {isOpen ? "close" : "support_agent"}
        </span>

        {/* Unread pulse indicator */}
        {hasUnread && !isOpen && (
          <>
            <span className="absolute top-0.5 end-0.5 w-3.5 h-3.5 rounded-full bg-accent-yellow opacity-80 animate-ping" />
            <span className="absolute top-0.5 end-0.5 w-3.5 h-3.5 rounded-full bg-accent-yellow border-2 border-white" />
          </>
        )}
      </button>

      {/*
       * ── Chat Panel ───────────────────────────────────────────────────────
       *
       * Positioning rationale:
       *   - bottom-[6.5rem] (104 px) — the trigger is 56px tall + 32px bottom
       *     offset = 88px from the bottom. Adding 16px gap lands the panel at
       *     104px, so the two never overlap.
       *   - end-6 (24px) — mirrors the trigger's inline-end position.
       *   - max-w-[22rem] with end-6 margin — keeps the panel from touching
       *     the viewport edge on small screens while staying comfortably clear
       *     of the sidebar on dashboard views.
       *   - max-h-[min(32rem,_calc(100vh-9rem))] — caps panel height so it
       *     never extends above the navbar (top 80px) while fitting tall screens.
       *   - z-[199] — below the trigger (z-[200]) so the close button is
       *     always reachable, but above all other page content (z-50 navbar).
       *   - pointer-events-none when closed prevents invisible clicks on
       *     underlying elements.
       */}
      <div
        id="chat-widget-panel"
        role="dialog"
        aria-label="Housing Regulations Chat Assistant"
        aria-modal="false"
        className={[
          // Position: above the trigger button with clear gap
          "fixed bottom-[6.5rem] end-6",
          // Stack below trigger, above all other page elements
          "z-[199]",
          // Sizing — responsive width, capped height
          "w-[min(22rem,_calc(100vw-48px))]",
          // Panel structure
          "flex flex-col rounded-2xl overflow-hidden",
          // Visual style — reuse existing tokens
          "shadow-soft-lg border border-outline-variant/50",
          "bg-surface",
          // Entrance animation
          "transition-all duration-300 ease-out origin-bottom-right",
          isOpen
            ? "opacity-100 scale-100 pointer-events-auto translate-y-0"
            : "opacity-0 scale-95 pointer-events-none translate-y-4",
        ].join(" ")}
      >
        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-4 py-3 bg-primary text-white shrink-0">
          <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-base">apartment</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-headline font-bold text-sm leading-tight truncate">
              Sakny AI Assistant
            </p>
            <p className="text-white/70 text-xs leading-tight">
              Housing Regulations Guide
            </p>
          </div>
          <button
            onClick={toggleOpen}
            aria-label="Close chat"
            className="p-1 rounded-full hover:bg-white/10 transition-colors duration-200 active:scale-90"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* ── Messages ── */}
        <div
          id="chat-widget-messages"
          className="flex-1 overflow-y-auto p-3 flex flex-col gap-3"
          style={{
            // Cap height so panel never extends behind the navbar.
            // min guarantees a usable viewport on compact screens.
            maxHeight: "min(20rem, calc(100vh - 14rem))",
            minHeight: "10rem",
          }}
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={[
                "flex gap-2 items-end",
                msg.role === "user" ? "flex-row-reverse" : "flex-row",
              ].join(" ")}
            >
              {/* Avatar */}
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-primary-fixed-dim flex items-center justify-center shrink-0 mb-0.5">
                  <span className="material-symbols-outlined text-primary text-sm">
                    support_agent
                  </span>
                </div>
              )}

              {/* Bubble */}
              <div
                className={[
                  "max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words",
                  msg.role === "user"
                    ? "bg-primary text-white rounded-tr-sm"
                    : "bg-surface-container-low text-on-surface rounded-tl-sm",
                ].join(" ")}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex gap-2 items-end">
              <div className="w-7 h-7 rounded-full bg-primary-fixed-dim flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-sm">support_agent</span>
              </div>
              <div className="bg-surface-container-low rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5 items-center">
                <span className="w-2 h-2 rounded-full bg-outline animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 rounded-full bg-outline animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 rounded-full bg-outline animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Input Row ── */}
        <div className="flex items-center gap-2 p-3 border-t border-outline-variant/40 bg-surface-container-lowest shrink-0">
          <input
            ref={inputRef}
            id="chat-widget-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="اسأل عن لوائح السكن... / Ask about housing..."
            disabled={isLoading}
            maxLength={500}
            autoComplete="off"
            className={[
              "flex-1 text-sm font-body rounded-xl border",
              "px-3.5 py-2.5 outline-none transition-all duration-200",
              "text-on-surface placeholder:text-on-surface-variant",
              "bg-surface-container border-outline-variant",
              "focus:border-primary focus:ring-2 focus:ring-primary/20",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            ].join(" ")}
          />
          <button
            id="chat-widget-send"
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            aria-label="Send message"
            className={[
              "w-10 h-10 rounded-xl shrink-0",
              "flex items-center justify-center",
              "transition-all duration-200",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              input.trim() && !isLoading
                ? "bg-primary text-white hover:bg-primary-container active:scale-90"
                : "bg-surface-container text-on-surface-variant cursor-not-allowed opacity-50",
            ].join(" ")}
          >
            <span className="material-symbols-outlined text-xl">send</span>
          </button>
        </div>

        {/* ── Footer ── */}
        <p className="text-center text-on-surface-variant/60 text-[10px] py-1.5 bg-surface-container-lowest border-t border-outline-variant/20 font-label shrink-0">
          Powered by Sakny AI · Housing Regulations Only
        </p>
      </div>
    </>
  );
};
