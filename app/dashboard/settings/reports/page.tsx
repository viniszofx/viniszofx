import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ReportsList } from "@/components/nodus/messages/dialogs";
import { SettingsLayout } from "@/components/settings/settings-layout";
import { auth } from "@/lib/auth/server";
import { isPlatformAdmin } from "@/lib/organizations/access";

export const metadata: Metadata = { title: "Denúncias | Ajustes" };

export default async function ReportsSettingsPage() {
  const { data } = await auth.getSession();
  if (!data?.user) redirect("/login");
  if (!await isPlatformAdmin(data.user.id)) redirect("/dashboard/settings");
  return <SettingsLayout title="Denúncias" description="Conversas e mensagens denunciadas nas Mensagens. Quem denunciou não é revelado à pessoa denunciada.">
    <div className="max-w-3xl"><ReportsList /></div>
  </SettingsLayout>;
}
