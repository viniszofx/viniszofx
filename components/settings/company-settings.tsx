"use client";
import { useState, type FormEvent } from "react";
import { AddressFields } from "@/components/ui/address-fields";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { LoadingBlock } from "@/components/ui/feedback";
import { Input } from "@/components/ui/input";
import { formatPhone } from "@/lib/employees/profile";
import { saveCompany, useCompany, type CompanyFields } from "@/lib/nodus/company";
import { services } from "@/lib/nodus/stores";

export function CompanySettings() {
  const { company, loaded } = useCompany();
  if (!loaded) return <LoadingBlock label="Carregando ajustes" />;
  return <CompanyForm initial={company} />;
}

function CompanyForm({ initial }: { initial: CompanyFields }) {
  const [value, setValue] = useState(initial);
  const [message, setMessage] = useState("");
  const patch = (next: Partial<CompanyFields>) => { setMessage(""); setValue(previous => ({ ...previous, ...next })); };
  function submit(event: FormEvent) {
    event.preventDefault();
    if (value.email && !/^\S+@\S+\.\S+$/.test(value.email)) { setMessage("Informe um e-mail válido."); return; }
    saveCompany(value); setMessage("Ajustes salvos.");
  }
  return <form onSubmit={submit} className="max-w-3xl space-y-7">
    <section className="space-y-4 border bg-card p-5" aria-labelledby="company-identity">
      <div><h2 id="company-identity" className="text-sm font-semibold">Identificação</h2><p className="text-xs text-muted-foreground">Aparece no cabeçalho das ordens de serviço impressas.</p></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome da empresa" className="sm:col-span-2"><Input maxLength={200} value={value.name} onChange={event => patch({ name: event.target.value })} /></Field>
        <Field label="CNPJ/CPF"><Input maxLength={24} value={value.document} onChange={event => patch({ document: event.target.value })} /></Field>
        <Field label="Responsável"><Input maxLength={200} value={value.responsible} onChange={event => patch({ responsible: event.target.value })} /></Field>
        <Field label="Telefone"><Input type="tel" value={value.phone} onChange={event => patch({ phone: formatPhone(event.target.value) })} /></Field>
        <Field label="E-mail"><Input type="email" maxLength={254} value={value.email} onChange={event => patch({ email: event.target.value })} /></Field>
      </div>
    </section>
    <section className="space-y-2 border bg-card p-5">
      <AddressFields value={value} onChange={patch} title="Endereço de origem" />
      <p className="text-xs text-muted-foreground">Ponto de partida e de retorno no cálculo de distância e tempo das viagens.</p>
    </section>
    <section className="space-y-4 border bg-card p-5" aria-labelledby="company-services">
      <div><h2 id="company-services" className="text-sm font-semibold">Serviços</h2><p className="text-xs text-muted-foreground">Cores usadas no calendário, nas ordens e nas viagens.</p></div>
      <ul className="grid gap-3 sm:grid-cols-2">{services.map(service => {
        const color = value.serviceColors[service.value] || service.color;
        return <li key={service.value} className="flex items-center gap-3 text-sm">
          <input type="color" aria-label={`Cor de ${service.label}`} value={color} onChange={event => patch({ serviceColors: { ...value.serviceColors, [service.value]: event.target.value } })} className="size-8 shrink-0 cursor-pointer border bg-transparent" />
          <span className="flex-1">{service.label}</span>
          {value.serviceColors[service.value] && <Button type="button" variant="ghost" size="xs" onClick={() => { const next = { ...value.serviceColors }; delete next[service.value]; patch({ serviceColors: next }); }}>Padrão</Button>}
        </li>;
      })}</ul>
    </section>
    <div className="flex flex-wrap items-center gap-4"><Button type="submit">Salvar ajustes</Button>{message && <p role="status" className="text-sm">{message}</p>}</div>
  </form>;
}
