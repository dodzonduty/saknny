import React from "react";
import { useTranslation } from "@/i18n/useTranslation";

export const DeadlinesSidepanel: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section className="bg-surface-container-low p-8 rounded-2xl h-full shadow-soft lg:sticky lg:top-24 border-none">
      <div className="flex items-center gap-2 mb-8">
        <span className="material-symbols-outlined text-primary">event_note</span>
        <h2 className="text-xl font-bold text-primary tracking-tight font-headline">{t("dashboard.deadlinesTitle")}</h2>
      </div>
      
      <div className="space-y-6">
        {/* Task 1 */}
        <div className="p-4 bg-white rounded-xl shadow-soft border-l-4 border-error space-y-2 opacity-80 cursor-not-allowed">
          <div className="flex justify-between items-start">
            <h4 className="font-bold text-primary text-sm">Submit Health Forms</h4>
            <span className="bg-error-container text-on-error-container text-[10px] font-black px-2 py-0.5 rounded">URGENT</span>
          </div>
          <p className="text-xs text-on-surface-variant">Mandatory medical clearance required before room assignment.</p>
          <div className="flex items-center gap-1 text-error text-[10px] font-bold">
            <span className="material-symbols-outlined text-xs">schedule</span>
            Due in 3 days
          </div>
        </div>
        
        {/* Task 2 */}
        <div className="p-4 bg-white rounded-xl shadow-soft border-l-4 border-emerald-500 opacity-70 space-y-2 cursor-not-allowed">
          <div className="flex justify-between items-start">
            <h4 className="font-bold text-primary text-sm">Initial Deposit</h4>
            <span className="material-symbols-outlined text-emerald-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          </div>
          <p className="text-xs text-on-surface-variant">Payment for the Fall 2024 housing reservation has been confirmed.</p>
          <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Completed</div>
        </div>
        
        {/* Task 3 */}
        <div className="p-4 bg-white rounded-xl shadow-soft border-l-4 border-primary-container space-y-2 opacity-80 cursor-not-allowed">
          <div className="flex justify-between items-start">
            <h4 className="font-bold text-primary text-sm">Select Move-in Slot</h4>
            <span className="material-symbols-outlined text-primary-container text-sm">lock_open</span>
          </div>
          <p className="text-xs text-on-surface-variant">Choose your preferred arrival window to avoid heavy traffic.</p>
          <div className="text-[10px] font-bold text-primary uppercase tracking-widest">Available next week</div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-outline-variant/30">
          <div className="bg-primary p-6 rounded-xl text-center space-y-3">
            <p className="text-white text-xs font-medium opacity-80">Sync your academic life</p>
            <h5 className="text-white font-bold">Download Housing Document</h5>
            <a
              href="/docs/enrollment-form.pdf"
              download="طلب التحاق 2026.pdf"
              className="block w-full bg-white text-primary py-2 rounded font-bold text-xs hover:bg-slate-50 transition-colors"
            >
              Download PDF
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
