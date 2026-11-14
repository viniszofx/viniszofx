import type { ReactNode } from "react";
import { auth } from "@/lib/auth/server";
import { isPlatformAdmin } from "@/lib/organizations/access";
import { currentOrganization } from "@/lib/organizations/current";
import { SettingsFrame, type SettingsGroup } from "./settings-frame";

/**
 * Todas as telas de ajustes num só lugar, agrupadas por escopo (como no Nodus).
 * Cada pessoa vê só o que pode acessar.
 */
async function settingsGroups(): Promise<SettingsGroup[]> {
  const [{ data }, organization] = await Promise.all([auth.getSession(), currentOrganization()]);
  const admin = !!data?.user && await isPlatformAdmin(data.user.id);
  const groups: (SettingsGroup | false)[] = [
    { title: "Sua conta", items: [
      { label: "Perfil e senha", icon: "profile", href: "/dashboard/settings/profile" },
      { label: "Aparência e Workplace", icon: "appearance", href: "/dashboard/settings/workplace" },
    ] },
    { title: "Ajuda", items: [{ label: "Suporte", icon: "support", href: "/dashboard/settings/support" }] },
    { title: organization?.organizationName || "Organização", items: [
      { label: "Empresa, serviços e cores", icon: "company", href: "/dashboard/settings/company" },
      ...(admin ? [{ label: "Denúncias", icon: "reports" as const, href: "/dashboard/settings/reports" }] : []),
    ] },
    admin && { title: "Administração da aplicação", items: [
      { label: "Organizações", icon: "organizations", href: "/dashboard/organizations" },
      { label: "Módulos", icon: "modules", href: "/dashboard/system/modules" },
    ] },
  ];
  return groups.filter((group): group is SettingsGroup => !!group && group.items.length > 0);
}

export async function SettingsLayout({ title, description, actions, menu, children }: { title: string; description?: string; actions?: ReactNode; menu?: boolean; children: ReactNode }) {
  return <SettingsFrame groups={await settingsGroups()} title={title} description={description} actions={actions} menu={menu}>{children}</SettingsFrame>;
}
