import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { ProfileForms } from "./profile-forms";

export const metadata: Metadata = { title: "Perfil | Viniccius" };

export default async function ProfileSettingsPage() {
  const { data } = await auth.getSession();
  if (!data?.user) redirect("/login");
  return <main className="flex w-full flex-col gap-7 px-4 pb-12 pt-6 sm:px-7">
    <div className="border-b pb-5">
      <Link href="/dashboard/settings" className="mb-2 block text-xs text-muted-foreground hover:text-primary">Console / Configurações</Link>
      <h1 className="text-2xl font-semibold">Perfil</h1>
      <p className="mt-1 text-sm text-muted-foreground">Seus dados de acesso e identificação no painel.</p>
    </div>
    <div className="max-w-3xl"><ProfileForms name={data.user.name ?? ""} email={data.user.email} /></div>
  </main>;
}
