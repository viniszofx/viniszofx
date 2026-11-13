"use client";
import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { RiArrowLeftLine, RiArrowRightLine, RiBuilding2Line, RiCheckLine, RiLoader4Line, RiMapPin2Line, RiUserLine } from "@remixicon/react";
import { AddressFields } from "@/components/ui/address-fields";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth/client";
import { formatPhone } from "@/lib/employees/profile";
import type { AddressFieldsValue } from "@/lib/format/address";

type Step = "account" | "company" | "address";
type Company = AddressFieldsValue & { name: string; document: string; phone: string; email: string; responsible: string };
const steps: { key: Step; label: string; icon: typeof RiUserLine }[] = [
  { key: "account", label: "Sua conta", icon: RiUserLine },
  { key: "company", label: "Empresa", icon: RiBuilding2Line },
  { key: "address", label: "Endereço", icon: RiMapPin2Line },
];

function Progress({ current, withAccount }: { current: Step; withAccount: boolean }) {
  const visible = withAccount ? steps : steps.slice(1);
  const index = visible.findIndex(step => step.key === current);
  return <ol className="mb-8 grid gap-2" style={{ gridTemplateColumns: `repeat(${visible.length}, minmax(0, 1fr))` }} aria-label="Etapas do cadastro">
    {visible.map((step, position) => { const Icon = step.icon; const done = position < index; const active = position === index;
      return <li key={step.key} aria-current={active ? "step" : undefined} className="space-y-2">
        <div className={`h-1 ${done || active ? "bg-primary" : "bg-muted"}`} />
        <p className={`flex items-center gap-1.5 text-xs ${active ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{done ? <RiCheckLine className="size-3.5 text-primary" /> : <Icon className="size-3.5" />}{step.label}</p>
      </li>; })}
  </ol>;
}

function Shell({ title, description, children }: { title: string; description: ReactNode; children: ReactNode }) {
  return <><h1 className="font-heading text-2xl font-semibold">{title}</h1><p className="mt-2 text-sm text-muted-foreground">{description}</p><div className="mt-7">{children}</div></>;
}

/** Onboarding da conta (Nodus: criar conta e organização): conta → empresa → endereço de origem. */
export function OnboardingWizard({ userName, firstAccount }: { userName: string | null; firstAccount: boolean }) {
  const [step, setStep] = useState<Step>(userName ? "company" : "account");
  const [name, setName] = useState(userName ?? "");
  const [company, setCompany] = useState<Company>({ name: "", document: "", phone: "", email: "", responsible: userName ?? "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const patch = (next: Partial<Company>) => { setError(""); setCompany(previous => ({ ...previous, ...next })); };

  async function createAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim(); const password = String(form.get("password") ?? "");
    if (password.length < 8) return setError("A senha deve ter ao menos 8 caracteres.");
    if (password !== form.get("confirmPassword")) return setError("As senhas não coincidem.");
    setBusy(true); setError("");
    try {
      const result = await authClient.signUp.email({ name: name.trim(), email, password });
      if (result.error) throw new Error(result.error.message || "Não foi possível criar a conta.");
      const session = await authClient.getSession();
      if (!session.data?.user) throw new Error("Conta criada. Confirme o e-mail, se necessário, e entre para continuar.");
      setCompany(previous => ({ ...previous, responsible: previous.responsible || name.trim(), email: previous.email || email }));
      setStep("company");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível criar a conta."); }
    finally { setBusy(false); }
  }

  async function finish(skipAddress = false) {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/onboarding", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(skipAddress ? { name: company.name, document: company.document, phone: company.phone, email: company.email, responsible: company.responsible } : company) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Não foi possível criar a organização.");
      window.location.replace("/dashboard");
    } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); setBusy(false); }
  }

  const alert = error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>;
  return <main className="flex min-h-svh items-center justify-center bg-muted/30 px-4 py-10 sm:px-6">
    <section className="w-full max-w-xl border bg-card p-6 sm:p-9">
      <p className="mb-6 text-xs font-semibold uppercase tracking-widest text-primary">Viniccius</p>
      <Progress current={step} withAccount={!userName} />
      {step === "account" && <Shell title={firstAccount ? "Crie a primeira conta" : "Crie sua conta"} description={firstAccount ? "A primeira conta administra a aplicação. Em seguida você cria a organização." : "Depois da conta, você cria a organização da sua equipe."}>
        <form onSubmit={event => void createAccount(event)} className="grid gap-4">
          <Field label="Nome" required><Input name="name" autoComplete="name" required autoFocus value={name} onChange={event => setName(event.target.value)} /></Field>
          <Field label="E-mail" required><Input name="email" type="email" autoComplete="username" required /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Senha" required hint="Mínimo de 8 caracteres."><Input name="password" type="password" autoComplete="new-password" minLength={8} required /></Field>
            <Field label="Confirme a senha" required><Input name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required /></Field>
          </div>
          {alert}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2"><Link href="/login" className="text-sm text-muted-foreground underline-offset-4 hover:underline">Já tenho conta</Link><Button type="submit" disabled={busy || !name.trim()}>{busy ? <><RiLoader4Line className="animate-spin" />Criando…</> : <>Continuar<RiArrowRightLine /></>}</Button></div>
        </form>
      </Shell>}
      {step === "company" && <Shell title="Crie sua organização" description={<>Olá{name ? `, ${name.split(" ")[0]}` : ""}! Dê um nome ao espaço que vai reunir sua equipe. Os dados aparecem nas ordens impressas e podem ser mudados depois em Configurações › Empresa.</>}>
        <form onSubmit={event => { event.preventDefault(); if (company.name.trim().length < 2) return setError("Informe o nome da organização."); if (company.email && !/^\S+@\S+\.\S+$/.test(company.email)) return setError("Informe um e-mail válido."); setStep("address"); }} className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome da organização" required className="sm:col-span-2"><Input autoFocus required maxLength={80} placeholder="Ex.: Eureka Instalações" value={company.name} onChange={event => patch({ name: event.target.value })} /></Field>
          <Field label="CNPJ/CPF"><Input maxLength={24} value={company.document} onChange={event => patch({ document: event.target.value })} /></Field>
          <Field label="Responsável"><Input maxLength={200} value={company.responsible} onChange={event => patch({ responsible: event.target.value })} /></Field>
          <Field label="Telefone"><Input type="tel" value={company.phone} onChange={event => patch({ phone: formatPhone(event.target.value) })} /></Field>
          <Field label="E-mail"><Input type="email" maxLength={254} value={company.email} onChange={event => patch({ email: event.target.value })} /></Field>
          <div className="sm:col-span-2">{alert}</div>
          <div className="flex justify-end sm:col-span-2"><Button type="submit">Continuar<RiArrowRightLine /></Button></div>
        </form>
      </Shell>}
      {step === "address" && <Shell title="Onde fica a empresa?" description="É o ponto de partida e de volta no cálculo de distância das viagens. Você pode pular e preencher depois.">
        <form onSubmit={event => { event.preventDefault(); void finish(); }}>
          <AddressFields value={company} onChange={patch} title="Endereço" showTitle={false} />
          {alert}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <Button type="button" variant="ghost" disabled={busy} onClick={() => setStep("company")}><RiArrowLeftLine />Voltar</Button>
            <div className="flex gap-2"><Button type="button" variant="outline" disabled={busy} onClick={() => void finish(true)}>Pular e concluir</Button><Button type="submit" disabled={busy}>{busy ? <><RiLoader4Line className="animate-spin" />Criando…</> : <>Criar organização<RiCheckLine /></>}</Button></div>
          </div>
        </form>
      </Shell>}
    </section>
  </main>;
}
