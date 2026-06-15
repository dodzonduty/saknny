import { Metadata } from "next";
import { DashboardPage } from "@/components/dashboard/DashboardPage";

export const metadata: Metadata = {
  title: "Sakny - Student Dashboard",
  description: "Manage your university housing application.",
};

export default function DashboardRoute() {
  return <DashboardPage />;
}
