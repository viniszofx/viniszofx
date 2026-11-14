import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SettingsLayout } from "@/components/settings/settings-layout";
import { SupportPage } from "@/components/settings/support-page";
import { auth } from "@/lib/auth/server";

export const metadata: Metadata = { title: "Suporte | Ajustes" };

export default async function SupportRoute() {
  const { data } = await auth.getSession();
  if (!data?.user) redirect("/login");
  return <SettingsLayout title="Suporte" description="Veja se o app está funcionando neste aparelho e resolva os problemas mais comuns.">
    <SupportPage user={{ id: data.user.id, name: data.user.name ?? "", email: data.user.email ?? "" }} />
  </SettingsLayout>;
}
