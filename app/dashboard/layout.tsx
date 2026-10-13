import { DashboardShell } from "@/components/dashboard-shell";

import { AppToasts } from "@/components/ui/app-toasts";
import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data } = await auth.getSession();
  if (!data?.user) redirect("/login");
  return <AppToasts><DashboardShell>{children}</DashboardShell></AppToasts>;
}
