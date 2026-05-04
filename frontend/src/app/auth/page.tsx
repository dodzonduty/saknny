import { Metadata } from "next";
import { AuthPage } from "@/components/auth/AuthPage";

export const metadata: Metadata = {
  title: "Sakny - Login or Register",
  description: "Sign in or create your student account to access Sakny university housing.",
};

export default function AuthRoute() {
  return <AuthPage />;
}
