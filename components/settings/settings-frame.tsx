"use client";
// Copiado do Nodus: moldura única dos Ajustes.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useState } from "react";
import {
  RiAlarmWarningLine, RiApps2Line, RiArrowLeftSLine, RiArrowRightSLine, RiBuilding2Line, RiCustomerService2Line, RiOrganizationChart, RiPaletteLine, RiUserLine,
} from "@remixicon/react";

const icons = {
  profile: RiUserLine, appearance: RiPaletteLine, support: RiCustomerService2Line, company: RiBuilding2Line,
  reports: RiAlarmWarningLine, organizations: RiOrganizationChart, modules: RiApps2Line,
} as const;
export type SettingsIcon = keyof typeof icons;
export type SettingsItem = { href: string; label: string; icon: SettingsIcon };
export type SettingsGroup = { title: string; items: SettingsItem[] };

const isCurrent = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

// No computador: um cartão com a navegação à esquerda, o caminho no topo e a explicação no rodapé.
// No celular: como os Ajustes do iPhone. A tela aberta ocupa a largura toda, com "‹ Ajustes" no topo,
// que leva à lista agrupada (título do grupo em cinza, linhas num cartão arredondado com "›").
export function SettingsFrame({ groups, title, description, actions, menu = false, children }: {
  groups: SettingsGroup[];
  title: string;
  description?: string;
  actions?: ReactNode;
  /** Entrada dos Ajustes: no celular começa na lista de seções. */
  menu?: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [listOpen, setListOpen] = useState(menu);
  const parent = groups.find(group => group.items.some(item => isCurrent(pathname, item.href)))?.title;
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pt-6 pb-12 sm:px-7">
      <h1 className={`mb-5 wrap-break-word text-2xl font-bold tracking-tight sm:mb-8 sm:text-3xl ${listOpen ? "" : "max-md:hidden"}`}>Ajustes</h1>

      {/* Celular: lista agrupada dos ajustes. */}
      {listOpen && <nav aria-label="Seções dos ajustes" className="grid gap-6 md:hidden">
        {groups.map(group => (
          <div key={group.title}>
            <p className="mb-1.5 truncate px-4 text-[13px] text-muted-foreground uppercase">{group.title}</p>
            <ul className="overflow-hidden rounded-2xl border glass-card shadow-sm">
              {group.items.map(item => {
                const Icon = icons[item.icon];
                const current = isCurrent(pathname, item.href);
                return <li key={item.href}>
                  <Link href={item.href} aria-current={current ? "page" : undefined} onClick={() => setListOpen(false)}
                    className="flex items-center gap-3 pl-4 text-[17px] outline-none active:bg-muted focus-visible:bg-muted">
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="size-[18px]" /></span>
                    <span className="flex min-w-0 flex-1 items-center gap-2 border-b border-border py-3 pr-3">
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      <RiArrowRightSLine aria-hidden="true" className="size-5 shrink-0 text-muted-foreground/70" />
                    </span>
                  </Link>
                </li>;
              })}
            </ul>
          </div>
        ))}
      </nav>}

      <div className={`flex flex-col md:min-h-[70dvh] md:flex-row md:overflow-hidden md:rounded-xl md:border md:glass-card md:shadow-sm ${listOpen ? "max-md:hidden" : ""}`}>
        <aside className="hidden shrink-0 bg-foreground/[0.03] p-3 md:block md:w-60 md:border-r">
          <nav aria-label="Seções dos ajustes" className="flex flex-col gap-4">
            {groups.map(group => (
              <div key={group.title}>
                <p className="mb-1 truncate px-2.5 text-xs font-semibold text-muted-foreground">{group.title}</p>
                <ul className="grid gap-0.5">
                  {group.items.map(item => {
                    const Icon = icons[item.icon];
                    return <li key={item.href}>
                      <Link href={item.href} aria-current={isCurrent(pathname, item.href) ? "page" : undefined}
                        className="flex items-center gap-2 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/30 aria-[current=page]:bg-primary/10 aria-[current=page]:font-medium aria-[current=page]:text-primary aria-[current=page]:hover:bg-primary/10">
                        <Icon className="size-4 shrink-0" />{item.label}
                      </Link>
                    </li>;
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Celular: "‹ Ajustes" volta para a lista; título grande da tela aberta embaixo. */}
          <div className="mb-3 md:hidden">
            <button type="button" onClick={() => setListOpen(true)}
              className="-ml-2 flex items-center rounded-lg pr-2 text-[17px] text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <RiArrowLeftSLine aria-hidden="true" className="size-7" />Ajustes
            </button>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-2">
              <h2 className="min-w-0 wrap-break-word text-2xl font-bold tracking-tight">{title}</h2>
              {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
            </div>
          </div>
          <header className="hidden min-h-12 flex-wrap items-center gap-2 border-b px-3 py-1.5 md:flex">
            <nav aria-label="Caminho" className="flex min-w-0 flex-1 flex-wrap items-center gap-0.5 text-base font-semibold">
              {parent && <>
                <span className="truncate px-1 font-normal text-muted-foreground">{parent}</span>
                <RiArrowRightSLine aria-hidden="true" className="size-4 text-muted-foreground" />
              </>}
              <h2 className="truncate px-1">{title}</h2>
            </nav>
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
          </header>
          <div className="min-w-0 flex-1 md:p-4">{children}</div>
          {description && <p className="px-1 pt-3 text-xs text-muted-foreground md:border-t md:px-4 md:py-2">{description}</p>}
        </div>
      </div>
    </section>
  );
}
