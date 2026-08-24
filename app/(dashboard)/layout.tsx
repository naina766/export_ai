import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: { default: "Dashboard | EXPORT AI", template: "%s | EXPORT AI" },
  description: "AI-Powered Export Sales & Buyer Outreach CRM",
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return <AppShell>{children}</AppShell>;
}
