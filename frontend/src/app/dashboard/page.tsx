import { Metadata } from "next";
import { DashboardPage } from "@/components/dashboard/DashboardPage";

export const metadata: Metadata = {
  title: "Sakny - Student Dashboard",
  description: "Manage your housing application and track your document verification status.",
};

export default function DashboardRoute() {
  return <DashboardPage />;
}
