"use client";

import React, { useState } from "react";
import { AuthHeader } from "./AuthHeader";
import { AuthTabs } from "./AuthTabs";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";

type Tab = "login" | "register";

export const AuthPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("login");

  return (
    <div className="min-h-screen bg-primary flex flex-col items-center justify-center relative overflow-hidden px-4 py-12 md:py-24">
      {/* Decorative background blobs (Flexbox/Padding friendly approach or absolute for purely decorative bg) */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent-yellow/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className={`w-full ${activeTab === "login" ? "max-w-lg" : "max-w-2xl"} bg-surface rounded-xl shadow-soft-lg flex flex-col p-8 md:p-12 relative z-10 transition-all duration-500`}>
        
        <AuthHeader activeTab={activeTab} />
        
        <div className="mt-8 mb-8">
            <AuthTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>

        {/* Content Area */}
        <div className="flex-grow">
          <div className={activeTab === "login" ? "block" : "hidden"}>
             <LoginForm onSwitchToRegister={() => setActiveTab("register")} />
          </div>
          <div className={activeTab === "register" ? "block" : "hidden"}>
             <RegisterForm onSwitchToLogin={() => setActiveTab("login")} />
          </div>
        </div>

      </div>
    </div>
  );
};
