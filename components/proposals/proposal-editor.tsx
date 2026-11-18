"use client";
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RiAddLine, RiArrowDownLine, RiArrowLeftLine, RiArrowUpLine, RiDeleteBinLine, RiPrinterLine, RiSave3Line } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { LoadingBlock } from "@/components/ui/feedback";
import { Field, Select, Textarea } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useClients } from "@/lib/clients/store";
import { parseBRLInput } from "@/lib/format/currency";
import { fieldsOf } from "@/lib/records/store";
import { printProposal } from "@/lib/proposals/print";
import { missingFields, proposalDays, proposalStatuses, proposalStore, proposalTotal, type Proposal, type ProposalFields, type ProposalStage } from "@/lib/proposals/store";
import { notifyError } from "@/lib/ui/notifications";
import { cn } from "@/lib/utils";

const money = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const moneyInput = (value: string) => value ? money.format(Number(value)) : "";

function Section({ index, title, hint, children }: { index: string; title: string; hint?: string; children: ReactNode }) {
  return <section className="grid gap-4 border bg-card/40 p-5 sm:p-6">
    <header><p className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.2em] text-primary"><span className="tabular-nums">{index}</span><span aria-hidden="true" className="h-px w-8 bg-current opacity-60" />{title}</p>{hint && <p className="mt-2 text-sm text-muted-foreground">{hint}</p>}</header>
    {children}
  </section>;
}

/** Lista de textos com adicionar, remover e reordenar. */
function TextList({ label, items, placeholder, onChange, max = 8 }: { label: string; items: string[]; placeholder: string; onChange: (items: string[]) => void; max?: number }) {
  const set = (index: number, value: string) => onChange(items.map((item, current) => current === index ? value : item));
  const move = (index: number, to: number) => { const next = [...items]; [next[index], next[to]] = [next[to], next[index]]; onChange(next); };
  return <fieldset className="grid gap-2"><legend className="mb-2 text-sm">{label}</legend>
    {items.map((item, index) => <div key={index} className="flex items-center gap-1.5">
      <Input aria-label={`${label} ${index + 1}`} value={item} placeholder={placeholder} onChange={event => set(index, event.target.value)} />
      <Button type="button" variant="ghost" size="icon-sm" aria-label="Subir" disabled={!index} onClick={() => move(index, index - 1)}><RiArrowUpLine /></Button>
      <Button type="button" variant="ghost" size="icon-sm" aria-label="Descer" disabled={index === items.length - 1} onClick={() => move(index, index + 1)}><RiArrowDownLine /></Button>
      <Button type="button" variant="ghost" size="icon-sm" aria-label="Remover" onClick={() => onChange(items.filter((_, current) => current !== index))}><RiDeleteBinLine /></Button>
    </div>)}
    {items.length < max && <Button type="button" variant="outline" size="sm" className="justify-self-start" onClick={() => onChange([...items, ""])}><RiAddLine />Adicionar</Button>}
  </fieldset>;
}

export function ProposalEditor({ proposalId }: { proposalId: string }) {
  const { records, loaded } = proposalStore.useRecords();
  const record = records.find(item => item.id === proposalId);
  if (!loaded) return <main className="mx-auto w-full max-w-5xl px-4 py-10"><LoadingBlock label="Carregando proposta" /></main>;
  if (!record) return <main className="mx-auto grid w-full max-w-5xl gap-3 px-4 py-16 text-center"><p className="font-medium">Proposta não encontrada.</p><Link href="/dashboard/proposals" className="text-sm text-primary hover:underline">Voltar às propostas</Link></main>;
  return <Editor key={record.id} record={record} />;
}

function Editor({ record }: { record: Proposal }) {
  const router = useRouter();
  const { clients } = useClients();
  const [draft, setDraft] = useState<ProposalFields>(() => fieldsOf<ProposalFields>(record));
  const [dirty, setDirty] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmPrint, setConfirmPrint] = useState<string[] | null>(null);
  const update = (change: Partial<ProposalFields>) => { setDraft(previous => ({ ...previous, ...change })); setDirty(true); };
  const setStage = (index: number, change: Partial<ProposalStage>) => update({ stages: draft.stages.map((stage, current) => current === index ? { ...stage, ...change } : stage) });
  const total = proposalTotal(draft.stages); const days = proposalDays(draft.stages);

  function save(silent = false) {
    if (!proposalStore.save(draft, record.id, { silent })) { notifyError("Proposta não salva", "Tente de novo em instantes."); return false; }
    setDirty(false); return true;
  }
  function print() {
    const missing = missingFields(draft);
    if (missing.length && !confirmPrint) { setConfirmPrint(missing); return; }
    setConfirmPrint(null);
    if (dirty) save(true);
    printProposal(draft);
  }
  function chooseClient(id: string) {
    const client = clients.find(item => item.id === id);
    update(client ? { clientId: id, companyName: client.company || client.name, contactName: client.company ? client.name : draft.contactName, companyDocument: client.document ?? draft.companyDocument } : { clientId: "" });
  }

  return <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div className="min-w-0">
        <Link href="/dashboard/proposals" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><RiArrowLeftLine className="size-4" />Propostas</Link>
        <h1 className="mt-2 truncate font-heading text-3xl font-normal tracking-tight">{draft.project || "Nova proposta"}</h1>
        <p className="mt-1 font-mono text-xs text-muted-foreground">Nº {draft.number}{dirty && " · alterações não salvas"}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Select aria-label="Situação" value={draft.status} options={proposalStatuses} onChange={event => update({ status: event.target.value as ProposalFields["status"] })} className="w-36" />
        <Button variant="outline" onClick={() => save()} disabled={!dirty}><RiSave3Line />Salvar</Button>
        <Button onClick={print}><RiPrinterLine />Gerar PDF</Button>
        <Button variant="ghost" size="icon" aria-label="Excluir proposta" title="Excluir proposta" onClick={() => setDeleting(true)}><RiDeleteBinLine /></Button>
      </div>
    </header>

    <Section index="Capa" title="Para quem" hint="Escolha um cliente do cadastro para preencher a empresa e o contato, ou digite.">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Cliente do cadastro"><Select value={draft.clientId} placeholder="Nenhum (digitar abaixo)" options={clients.map(client => ({ value: client.id, label: client.company ? `${client.company} · ${client.name}` : client.name }))} onChange={event => chooseClient(event.target.value)} /></Field>
        <Field label="Nome do projeto" required><Input value={draft.project} placeholder="Ex.: Controle de pedidos" onChange={event => update({ project: event.target.value })} /></Field>
        <Field label="Empresa" required><Input value={draft.companyName} onChange={event => update({ companyName: event.target.value })} /></Field>
        <Field label="Contato"><Input value={draft.contactName} onChange={event => update({ contactName: event.target.value })} /></Field>
        <Field label="CNPJ / CPF da empresa"><Input value={draft.companyDocument} onChange={event => update({ companyDocument: event.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Data"><Input type="date" value={draft.date} onChange={event => update({ date: event.target.value })} /></Field>
          <Field label="Validade (dias)" required><Input inputMode="numeric" value={draft.validityDays} onChange={event => update({ validityDays: event.target.value.replace(/\D/g, "") })} /></Field>
        </div>
      </div>
    </Section>

    <Section index="01" title="O que ouvimos" hint="Nas palavras de quem faz o trabalho. Fale da dor, não da tecnologia.">
      <Field label="Como o trabalho é feito hoje"><Textarea rows={4} value={draft.today} placeholder="Quem faz, onde os dados ficam (planilhas, mensagens, sistemas) e quanto tempo leva." onChange={event => update({ today: event.target.value })} /></Field>
      <TextList label="O que mais incomoda" items={draft.pains} placeholder="Ex.: a equipe copia dados de uma planilha para outra" max={6} onChange={pains => update({ pains })} />
    </Section>

    <Section index="02" title="A solução" hint="Uma frase sobre o resultado e o quadro Hoje → Depois.">
      <Field label="O que muda na prática"><Textarea rows={2} value={draft.solution} placeholder="Ex.: os pedidos entram uma vez só, e o painel mostra o andamento de tudo, na hora." onChange={event => update({ solution: event.target.value })} /></Field>
      <fieldset className="grid gap-2"><legend className="mb-2 text-sm">Hoje → Depois</legend>
        {draft.changes.map((change, index) => <div key={index} className="grid items-center gap-1.5 sm:grid-cols-[1fr_auto_1fr_auto]">
          <Input aria-label={`Hoje ${index + 1}`} value={change.before} placeholder="Hoje" onChange={event => update({ changes: draft.changes.map((item, current) => current === index ? { ...item, before: event.target.value } : item) })} />
          <span aria-hidden="true" className="hidden text-primary sm:block">→</span>
          <Input aria-label={`Depois ${index + 1}`} value={change.after} placeholder="Depois" onChange={event => update({ changes: draft.changes.map((item, current) => current === index ? { ...item, after: event.target.value } : item) })} />
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Remover" onClick={() => update({ changes: draft.changes.filter((_, current) => current !== index) })}><RiDeleteBinLine /></Button>
        </div>)}
        {draft.changes.length < 6 && <Button type="button" variant="outline" size="sm" className="justify-self-start" onClick={() => update({ changes: [...draft.changes, { before: "", after: "" }] })}><RiAddLine />Adicionar</Button>}
      </fieldset>
    </Section>

    <Section index="03" title="Escopo e etapas" hint="Cada etapa entrega uma parte funcionando, com prazo e valor fechados. Sem valor inventado: o que faltar sai como [campo a preencher].">
      <ol className="grid gap-3">{draft.stages.map((stage, index) => <li key={index} className="grid gap-3 border p-4 sm:grid-cols-[2.5rem_1fr_7rem_9rem_auto] sm:items-start">
        <span className="font-heading text-2xl font-light text-primary tabular-nums">{String(index + 1).padStart(2, "0")}</span>
        <div className="grid gap-2">
          <Input aria-label={`Etapa ${index + 1}`} value={stage.title} placeholder="Nome da etapa" onChange={event => setStage(index, { title: event.target.value })} />
          <Textarea aria-label={`Entrega da etapa ${index + 1}`} rows={2} value={stage.deliverable} placeholder="O que fica pronto e funcionando ao fim desta etapa" onChange={event => setStage(index, { deliverable: event.target.value })} />
        </div>
        <Field label="Prazo (dias)"><Input inputMode="numeric" value={stage.days} onChange={event => setStage(index, { days: event.target.value.replace(/\D/g, "") })} /></Field>
        <Field label="Valor (R$)"><Input inputMode="numeric" value={moneyInput(stage.value)} placeholder="0,00" onChange={event => setStage(index, { value: parseBRLInput(event.target.value) })} /></Field>
        <div className="flex gap-1 sm:flex-col sm:pt-6">
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Subir etapa" disabled={!index} onClick={() => { const next = [...draft.stages]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; update({ stages: next }); }}><RiArrowUpLine /></Button>
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Remover etapa" onClick={() => update({ stages: draft.stages.filter((_, current) => current !== index) })}><RiDeleteBinLine /></Button>
        </div>
      </li>)}</ol>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {draft.stages.length < 8 ? <Button type="button" variant="outline" size="sm" onClick={() => update({ stages: [...draft.stages, { title: "", deliverable: "", days: "", value: "" }] })}><RiAddLine />Adicionar etapa</Button> : <span />}
        <p className="text-sm"><span className="text-muted-foreground">Total:</span> <strong className="tabular-nums">{days ? `${days} dias` : "—"} · R$ {total ? money.format(total) : "—"}</strong>{draft.stages.some(stage => !stage.value || !stage.days) && <span className="block text-xs text-muted-foreground">Etapas sem prazo ou valor: o total sai em aberto no PDF.</span>}</p>
      </div>
      <div className="grid gap-6 border-t pt-4 md:grid-cols-2">
        <TextList label="Está incluso" items={draft.included} placeholder="Item incluso ({empresa} vira o nome da empresa)" onChange={included => update({ included })} />
        <TextList label="Não está incluso" items={draft.excluded} placeholder="Ex.: custos de hospedagem" onChange={excluded => update({ excluded })} />
      </div>
    </Section>

    <Section index="06" title="Investimento e condições" hint="As seções 04 (Como trabalhamos), 05 (IA consciente) e 07 (Perguntas) vêm prontas do site.">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Pagamento"><Input value={draft.payment} placeholder="Ex.: por etapa, na entrega" onChange={event => update({ payment: event.target.value })} /></Field>
        <Field label="Forma de pagamento" required><Input value={draft.paymentMethod} placeholder="Pix / boleto / transferência" onChange={event => update({ paymentMethod: event.target.value })} /></Field>
        <Field label="Início"><Input value={draft.start} placeholder="Ex.: até 7 dias após o aceite" onChange={event => update({ start: event.target.value })} /></Field>
        <Field label="Acompanhamento após publicar (dias)"><Input inputMode="numeric" value={draft.followUpDays} onChange={event => update({ followUpDays: event.target.value.replace(/\D/g, "") })} /></Field>
      </div>
    </Section>

    <Section index="—" title="Anotações internas" hint="Não vão para o PDF.">
      <Textarea rows={3} value={draft.notes} onChange={event => update({ notes: event.target.value })} />
    </Section>

    <div className={cn("sticky bottom-4 z-10 flex justify-end gap-2", !dirty && "hidden")}>
      <Button className="shadow-lg" onClick={() => save()}><RiSave3Line />Salvar alterações</Button>
    </div>

    {confirmPrint && <ConfirmDialog title="Gerar PDF com campos em aberto?" description={`Faltam: ${confirmPrint.join(", ")}. Eles saem destacados como [campo a preencher], sem valor inventado.`} confirmLabel="Gerar mesmo assim"
      onConfirm={() => { if (dirty) save(true); printProposal(draft); }} onClose={() => setConfirmPrint(null)} />}
    {deleting && <ConfirmDialog title="Excluir proposta?" description={`A proposta ${draft.number}${draft.project ? ` (${draft.project})` : ""} será removida.`}
      onConfirm={() => { proposalStore.remove(record.id); router.push("/dashboard/proposals"); }} onClose={() => setDeleting(false)} />}
  </main>;
}
