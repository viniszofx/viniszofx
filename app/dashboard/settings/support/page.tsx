import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SupportPage } from "@/components/settings/support-page";
import { auth } from "@/lib/auth/server";

export const metadata: Metadata = { title: "Suporte | Configurações" };

export default async function SupportRoute() {
  const { data } = await auth.getSession();
  if (!data?.user) redirect("/login");
  return <main className="flex w-full flex-col gap-7 px-4 pb-12 pt-6 sm:px-7">
    <div className="border-b pb-5">
      <Link href="/dashboard/settings" className="mb-2 block text-xs text-muted-foreground hover:text-primary">Console / Configurações</Link>
      <h1 className="text-2xl font-semibold">Suporte</h1>
      <p className="mt-1 text-sm text-muted-foreground">Veja se o app está funcionando neste aparelho e resolva os problemas mais comuns.</p>
    </div>
    <SupportPage user={{ id: data.user.id, name: data.user.name ?? "", email: data.user.email ?? "" }} />
  </main>;
}
