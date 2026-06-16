"use client";

import React, { useEffect, useState } from "react";

export function GlobalAlertProvider() {
  const [alerts, setAlerts] = useState<{id: number, msg: string, isError: boolean}[]>([]);

  useEffect(() => {
    // Only run on client
    if (typeof window === "undefined") return;

    const originalAlert = window.alert;
    window.alert = (message: any) => {
      const msgStr = String(message);
      // Determine if it's an error based on simple keywords.
      // Most of our alerts are errors unless they contain "Success" or "successfully".
      const lowerMsg = msgStr.toLowerCase();
      const isError = !lowerMsg.includes("success");
      
      const newAlert = { id: Date.now() + Math.random(), msg: msgStr, isError };
      setAlerts(prev => [...prev, newAlert]);
      
      // Auto dismiss after 4 seconds
      setTimeout(() => {
        setAlerts(prev => prev.filter(a => a.id !== newAlert.id));
      }, 4000);
    };

    return () => {
      window.alert = originalAlert;
    };
  }, []);

  if (alerts.length === 0) return null;

  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      {alerts.map(a => (
        <div 
          key={a.id} 
          className={`pointer-events-auto px-5 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-8 fade-in duration-300 max-w-sm border-l-4 ${a.isError ? 'bg-error-container text-on-error-container border-error' : 'bg-emerald-50 text-emerald-900 border-emerald-500'}`}
        >
          <span className={`material-symbols-outlined text-[24px] ${a.isError ? 'text-error' : 'text-emerald-600'}`}>
            {a.isError ? 'error' : 'check_circle'}
          </span>
          <div className="font-bold text-sm leading-tight flex-1">
            {a.msg}
          </div>
          <button 
            onClick={() => setAlerts(prev => prev.filter(x => x.id !== a.id))}
            className="opacity-50 hover:opacity-100 transition-opacity"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      ))}
    </div>
  );
}
