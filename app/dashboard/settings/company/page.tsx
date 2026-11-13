import type { Metadata } from "next";
import Link from "next/link";
import { CompanySettings } from "@/components/settings/company-settings";

export const metadata: Metadata = { title: "Empresa | Configurações" };

export default function CompanySettingsPage() {
  return <main className="flex w-full flex-col gap-7 px-4 pb-12 pt-6 sm:px-7">
    <div className="border-b pb-5">
      <Link href="/dashboard/settings" className="mb-2 block text-xs text-muted-foreground hover:text-primary">Console / Configurações</Link>
      <h1 className="text-2xl font-semibold">Empresa</h1>
      <p className="mt-1 text-sm text-muted-foreground">Identificação, endereço de origem e cores dos serviços.</p>
    </div>
    <CompanySettings />
  </main>;
}
