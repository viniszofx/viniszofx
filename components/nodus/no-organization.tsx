"use client";
import { useEffect, useState, type FormEvent } from "react";
import { RiAddLine, RiBuilding2Line, RiLoader4Line } from "@remixicon/react";
import { AddressFields } from "@/components/ui/address-fields";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { formatPhone } from "@/lib/employees/profile";
import type { AddressFieldsValue } from "@/lib/format/address";

type Company = AddressFieldsValue & { name: string; document: string; phone: string; email: string; responsible: string };

/** Cria a organização da conta ali mesmo, num diálogo (sem sair da página). */
export function CreateOrganizationDialog({ onClose }: { onClose: () => void }) {
  const [company, setCompany] = useState<Company>({ name: "", document: "", phone: "", email: "", responsible: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const patch = (next: Partial<Company>) => { setError(""); setCompany(previous => ({ ...previous, ...next })); };
  async function submit(event: FormEvent) {
    event.preventDefault(); if (busy) return;
    if (company.name.trim().length < 2) return setError("Informe o nome da organização.");
    setBusy(true);
    try {
      const response = await fetch("/api/onboarding", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(company) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Não foi possível criar a organização.");
      location.reload();
    } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); setBusy(false); }
  }
  return <Dialog open onOpenChange={open => { if (!open && !busy) onClose(); }}><DialogContent className="sm:max-w-2xl">
    <DialogTitle>Criar organização</DialogTitle>
    <DialogDescription>Você entra como membro. Os dados vão para Configurações › Empresa e podem ser mudados depois.</DialogDescription>
    <form onSubmit={event => void submit(event)} className="grid gap-4 sm:grid-cols-2">
      <Field label="Nome da organização" required className="sm:col-span-2"><Input autoFocus required maxLength={80} placeholder="Ex.: Eureka Instalações" value={company.name} onChange={event => patch({ name: event.target.value })} /></Field>
      <Field label="CNPJ/CPF"><Input maxLength={24} value={company.document} onChange={event => patch({ document: event.target.value })} /></Field>
      <Field label="Responsável"><Input maxLength={200} value={company.responsible} onChange={event => patch({ responsible: event.target.value })} /></Field>
      <Field label="Telefone"><Input type="tel" value={company.phone} onChange={event => patch({ phone: formatPhone(event.target.value) })} /></Field>
      <Field label="E-mail"><Input type="email" maxLength={254} value={company.email} onChange={event => patch({ email: event.target.value })} /></Field>
      <div className="sm:col-span-2"><AddressFields value={company} onChange={patch} title="Endereço (opcional)" /></div>
      {error && <p role="alert" className="text-sm text-destructive sm:col-span-2">{error}</p>}
      <div className="flex justify-end gap-2 sm:col-span-2"><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancelar</Button><Button type="submit" disabled={busy}>{busy ? <><RiLoader4Line className="animate-spin" />Criando…</> : "Criar organização"}</Button></div>
    </form>
  </DialogContent></Dialog>;
}

/** Estado vazio dos recursos da organização (mural, mensagens) para quem ainda não tem uma. */
export function NoOrganization({ feature }: { feature: string }) {
  const [canCreate, setCanCreate] = useState<boolean | null>(null);
  const [creating, setCreating] = useState(false);
  useEffect(() => {
    let alive = true;
    fetch("/api/onboarding", { cache: "no-store" }).then(response => response.ok ? response.json() : { canCreate: false })
      .then(body => { if (alive) setCanCreate(!!body.canCreate); }).catch(() => { if (alive) setCanCreate(false); });
    return () => { alive = false; };
  }, []);
  return <section className="grid justify-items-center gap-4 border border-dashed px-6 py-12 text-center">
    <span className="grid size-12 place-items-center bg-primary/10 text-primary"><RiBuilding2Line className="size-6" /></span>
    <div className="max-w-md space-y-1"><h2 className="font-semibold">Você ainda não está em uma organização</h2>
      <p className="text-sm text-muted-foreground">{feature} reúne as pessoas da sua organização. {canCreate === false ? "Peça a quem administra o sistema para incluir seu e-mail em uma organização." : "Crie a sua para começar; você pode convidar a equipe depois."}</p></div>
    {canCreate && <Button onClick={() => setCreating(true)}><RiAddLine />Criar organização</Button>}
    {creating && <CreateOrganizationDialog onClose={() => setCreating(false)} />}
  </section>;
}

/** Aviso no Início para quem ainda pode criar a própria organização. */
export function OrganizationPrompt() {
  const [canCreate, setCanCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  useEffect(() => {
    let alive = true;
    fetch("/api/onboarding", { cache: "no-store" }).then(response => response.ok ? response.json() : { canCreate: false })
      .then(body => { if (alive) setCanCreate(!!body.canCreate); }).catch(() => undefined);
    return () => { alive = false; };
  }, []);
  if (!canCreate) return null;
  return <section className="mt-7 flex flex-wrap items-center justify-between gap-4 border border-primary/40 bg-primary/5 p-5">
    <div className="flex min-w-0 gap-3"><span className="grid size-10 shrink-0 place-items-center bg-primary text-primary-foreground"><RiBuilding2Line className="size-5" /></span><div className="min-w-0"><h2 className="font-semibold">Crie sua organização</h2><p className="text-sm text-muted-foreground">Mural e mensagens são da organização. Crie a sua para usar com a equipe.</p></div></div>
    <Button onClick={() => setCreating(true)}><RiAddLine />Criar organização</Button>
    {creating && <CreateOrganizationDialog onClose={() => setCreating(false)} />}
  </section>;
}
