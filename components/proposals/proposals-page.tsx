"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { RiAddLine, RiFileList3Line, RiSearchLine } from "@remixicon/react";
import { CatalogLayout } from "@/components/listing/catalog";
import { Button } from "@/components/ui/button";
import { Badge, LoadingBlock } from "@/components/ui/feedback";
import { surfaceVariants } from "@/components/ui/card";
import { useClients } from "@/lib/clients/store";
import { matchesText } from "@/lib/records/store";
import { emptyProposal, proposalStatus, proposalStatuses, proposalStore, proposalTotal, type ProposalStatus } from "@/lib/proposals/store";
import { cn } from "@/lib/utils";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const day = (value: string) => { const [y, m, d] = value.split("-"); return y && m && d ? `${d}/${m}/${y}` : "—"; };

/** Marketing › Propostas: propostas comerciais no padrão da marca, com PDF. */
export function ProposalsPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { records, loaded } = proposalStore.useRecords();
  const { clients } = useClients();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ProposalStatus | "">("");
  const created = useRef(false);

  function create(prefill = {}) {
    const saved = proposalStore.save(emptyProposal(records, prefill));
    if (saved) router.push(`/dashboard/proposals/${saved.id}`);
  }

  // Vindo de um lead (Marketing › Leads › Criar proposta): cria já com o contato e a empresa.
  useEffect(() => {
    if (!loaded || created.current || params.get("novo") !== "1") return;
    created.current = true;
    const saved = proposalStore.save(emptyProposal(records, { contactName: params.get("contato") ?? "", companyName: params.get("empresa") ?? "" }));
    if (saved) router.replace(`/dashboard/proposals/${saved.id}`);
  }, [loaded, params, records, router]);

  const clientName = (id: string) => clients.find(client => client.id === id)?.name ?? "";
  const sorted = useMemo(() => [...records].sort((a, b) => b.number.localeCompare(a.number)), [records]);
  const visible = sorted.filter(item => (!filter || item.status === filter) && matchesText([item.number, item.project, item.companyName, item.contactName, clientName(item.clientId)], search));
  const counts = Object.fromEntries(proposalStatuses.map(status => [status.value, records.filter(item => item.status === status.value).length]));

  return <CatalogLayout section="Ferramentas" title="Propostas" description="Propostas comerciais no padrão da marca: o que ouvimos, a solução, etapas com valor fechado e PDF pronto para enviar."
    action={<Button disabled={!loaded} onClick={() => create()}><RiAddLine />Nova proposta</Button>}>
    <div className="flex flex-wrap items-center gap-3">
      <label className="flex h-10 w-full max-w-sm items-center gap-2 border bg-card/60 px-3 focus-within:border-ring">
        <RiSearchLine className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <input aria-label="Buscar propostas" placeholder="Buscar por número, projeto, empresa ou contato…" value={search} onChange={event => setSearch(event.target.value)} className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground sm:text-sm" />
      </label>
      <div role="group" aria-label="Filtrar por situação" className="flex flex-wrap gap-1.5">
        <button type="button" aria-pressed={!filter} onClick={() => setFilter("")} className={cn("border px-3 py-1.5 text-xs", !filter ? "border-primary text-primary" : "text-muted-foreground hover:text-foreground")}>Todas · {records.length}</button>
        {proposalStatuses.map(status => <button key={status.value} type="button" aria-pressed={filter === status.value} onClick={() => setFilter(filter === status.value ? "" : status.value)}
          className={cn("border px-3 py-1.5 text-xs", filter === status.value ? "border-primary text-primary" : "text-muted-foreground hover:text-foreground")}>{status.label} · {counts[status.value]}</button>)}
      </div>
    </div>
    {!loaded ? <LoadingBlock label="Carregando propostas" />
      : !visible.length ? <div className={cn(surfaceVariants(), "grid place-items-center gap-2 rounded-none px-6 py-14 text-center")}>
        <RiFileList3Line className="size-8 text-muted-foreground/60" aria-hidden="true" />
        <p className="font-medium">{records.length ? "Nenhuma proposta encontrada" : "Nenhuma proposta ainda"}</p>
        <p className="max-w-sm text-sm text-muted-foreground">{records.length ? "Tente outra busca ou limpe o filtro." : "Crie a primeira: o documento segue o modelo da marca e sai em PDF pronto para enviar."}</p>
        {!records.length && <Button className="mt-2" onClick={() => create()}><RiAddLine />Nova proposta</Button>}
      </div>
      : <ul className={cn(surfaceVariants({ list: true }), "rounded-none")}>{visible.map(item => { const status = proposalStatus(item.status); const total = proposalTotal(item.stages);
        return <li key={item.id}><Link href={`/dashboard/proposals/${item.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-4 outline-none transition-colors hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:px-5">
          <span className="w-20 shrink-0 font-mono text-xs text-muted-foreground tabular-nums">{item.number}</span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2"><strong className="truncate">{item.project || "Projeto sem nome"}</strong><Badge color={status.color}>{status.label}</Badge></span>
            <span className="block truncate text-xs text-muted-foreground">{[item.companyName || clientName(item.clientId), item.contactName].filter(Boolean).join(" · ") || "Sem cliente"}</span>
          </span>
          <span className="text-sm font-medium tabular-nums">{total ? money.format(total) : "—"}</span>
          <span className="w-24 text-right text-xs text-muted-foreground tabular-nums">{day(item.date)}</span>
        </Link></li>; })}</ul>}
  </CatalogLayout>;
}
