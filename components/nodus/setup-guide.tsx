"use client";
import { surfaceVariants } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useState } from "react";
import Link from "next/link";
import { RiArrowRightSLine, RiBuildingLine, RiCarLine, RiCheckLine, RiCloseLine, RiFileList3Line, RiPlaneLine, RiSparklingLine, RiTeamLine, RiUserStarLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { useClients } from "@/lib/clients/store";
import { useEmployees } from "@/lib/employees/store";
import { useVehicles } from "@/lib/fleet/store";
import { useCompany } from "@/lib/nodus/company";
import { orderStore } from "@/lib/nodus/stores";
import { routable } from "@/lib/trips/route";
import { useTrips } from "@/lib/trips/store";
import { useModuleEnabled } from "@/lib/modules-context";

const hiddenKey = "viniszofx:setup-guide-hidden";
const readHidden = () => { try { return localStorage.getItem(hiddenKey) === "1"; } catch { return false; } };

/** Primeiros passos (Nodus): o que falta cadastrar para a operação começar. */
export function SetupGuide() {
  const [hidden, setHidden] = useState(() => typeof window !== "undefined" && readHidden());
  const company = useCompany(); const clients = useClients(); const employees = useEmployees(); const vehicles = useVehicles(); const trips = useTrips(); const orders = orderStore.useRecords();
  const enabled = useModuleEnabled();
  const loading = !company.loaded || !clients.loaded || !employees.loaded || !vehicles.loaded || !trips.loaded || !orders.loaded;
  const steps = [
    { id: "identity", done: !!company.company.name && routable(company.company), icon: RiBuildingLine, href: "/dashboard/settings/company", action: "Personalizar", title: "Dê a cara da sua empresa", description: "Nome, documento e endereço de origem usados nos PDFs e nas rotas." },
    { id: "clients", done: clients.clients.length > 0, icon: RiUserStarLine, href: "/dashboard/clients", action: "Cadastrar cliente", title: "Cadastre seus clientes", description: "Com endereços para planejar visitas, viagens e ordens." },
    { id: "employees", done: employees.employees.length > 0, icon: RiTeamLine, href: "/dashboard/employees", action: "Cadastrar colaborador", title: "Monte a equipe", description: "Colaboradores aparecem nas ordens, viagens e na agenda." },
    { id: "fleet", done: vehicles.vehicles.length > 0, icon: RiCarLine, href: "/dashboard/fleet", action: "Cadastrar veículo", title: "Adicione a frota", description: "Veículos ficam disponíveis para as viagens da equipe." },
    { id: "trips", done: trips.trips.length > 0, icon: RiPlaneLine, href: "/dashboard/trip", action: "Programar viagem", title: "Programe uma viagem", description: "Destinos, equipe, hospedagem e estimativa da rota." },
    { id: "orders", done: orders.records.length > 0, icon: RiFileList3Line, href: "/dashboard/orders", action: "Abrir ordem", title: "Abra a primeira ordem", description: "Serviço, materiais e equipe, com PDF pronto para assinatura." },
  ];
  const visible = steps.filter(step => step.id === "identity" || enabled(step.id === "trips" ? "trips" : step.id));
  const completed = visible.filter(step => step.done).length;
  if (hidden || loading || completed === visible.length) return null;
  const next = visible.find(step => !step.done);
  return <section aria-labelledby="setup-guide-title" className={cn(surfaceVariants(), "mt-7")}>
    <div className="flex flex-wrap items-start justify-between gap-4 p-5">
      <div className="flex min-w-0 gap-4"><span className="grid size-10 shrink-0 place-items-center bg-primary text-primary-foreground"><RiSparklingLine className="size-5" /></span><div className="min-w-0"><h2 id="setup-guide-title" className="font-semibold">Primeiros passos</h2><p className="text-sm text-muted-foreground">Deixe o painel pronto para a equipe trabalhar.</p></div></div>
      <div className="flex items-center gap-3"><div className="w-36"><p className="mb-1.5 text-right text-xs text-muted-foreground"><span className="font-semibold text-foreground">{completed}</span> de {visible.length} concluídos</p><div role="progressbar" aria-label="Progresso dos primeiros passos" aria-valuemin={0} aria-valuemax={visible.length} aria-valuenow={completed} className="h-1.5 bg-muted"><div className="h-full bg-primary" style={{ width: `${Math.round(completed / visible.length * 100)}%` }} /></div></div>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Ocultar primeiros passos" onClick={() => { try { localStorage.setItem(hiddenKey, "1"); } catch { /* só nesta sessão */ } setHidden(true); }}><RiCloseLine /></Button></div>
    </div>
    <ol className="grid gap-px border-t bg-border sm:grid-cols-2 lg:grid-cols-3">{visible.map(({ id, done, icon: Icon, href, action, title, description }) => <li key={id} className={`flex gap-3 bg-card p-4 ${next?.id === id ? "bg-primary/5" : ""}`}>
      <span className={`grid size-8 shrink-0 place-items-center ${done ? "bg-green-600 text-white" : "bg-muted text-muted-foreground"}`}>{done ? <RiCheckLine className="size-4" /> : <Icon className="size-4" />}</span>
      <div className="min-w-0 flex-1"><p className={`text-sm font-medium ${done ? "text-muted-foreground line-through" : ""}`}>{title}</p><p className="text-xs text-muted-foreground">{description}</p>{!done && <Link href={href} className="mt-1 inline-flex items-center text-xs font-medium text-primary hover:underline">{action}<RiArrowRightSLine className="size-3.5" /></Link>}</div>
    </li>)}</ol>
  </section>;
}
