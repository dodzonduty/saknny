import React from "react";
import { Metadata } from "next";
import { DashboardNavbar } from "@/components/dashboard/DashboardNavbar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export const metadata: Metadata = {
  title: "Sakny - Admin Dashboard",
  description: "University Housing Portal Administration",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      <DashboardNavbar isAdmin />
      <AdminSidebar />
      <main className="lg:ml-64 pt-24 pb-12 px-8 flex-grow">
        {children}
      </main>
    </div>
  );
}
