import type { Metadata } from "next";
import { CompanySettings } from "@/components/settings/company-settings";
import { SettingsLayout } from "@/components/settings/settings-layout";

export const metadata: Metadata = { title: "Empresa | Ajustes" };

export default function CompanySettingsPage() {
  return <SettingsLayout title="Empresa, serviços e cores" description="Identificação usada nos PDFs, endereço de origem das viagens e cores de cada serviço na agenda.">
    <CompanySettings />
  </SettingsLayout>;
}
