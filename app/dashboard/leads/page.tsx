import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LeadsPage } from "@/components/marketing/leads-page";
import { auth } from "@/lib/auth/server";
import { isPlatformAdmin } from "@/lib/organizations/access";

export const metadata: Metadata = { title: "Leads | Marketing" };

export default async function LeadsRoute() {
  const { data } = await auth.getSession();
  if (!data?.user) redirect("/login");
  if (!await isPlatformAdmin(data.user.id)) redirect("/dashboard");
  return <LeadsPage />;
}
