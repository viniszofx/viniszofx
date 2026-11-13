"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { RiChat3Line, RiCheckLine, RiCloseLine, RiLoader4Line, RiSendPlaneLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { formatPhone } from "@/lib/employees/profile";

const campaignKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];

/** Botão flutuante de conversa: vira lead em Marketing › Leads. */
export function LeadWidget() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [phone, setPhone] = useState("");
  const panel = useRef<HTMLDivElement>(null);
  // Outros botões da página (ex.: seção Contato) abrem a conversa por este evento.
  useEffect(() => {
    const show = () => { setOpen(true); setSent(false); };
    window.addEventListener("viniszofx:open-lead", show);
    return () => window.removeEventListener("viniszofx:open-lead", show);
  }, []);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", close);
    panel.current?.querySelector<HTMLInputElement>("input[name=name]")?.focus();
    return () => window.removeEventListener("keydown", close);
  }, [open]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const form = new FormData(event.currentTarget);
    const params = new URLSearchParams(location.search);
    const campaign = Object.fromEntries([...campaignKeys.map(key => [key, params.get(key) ?? ""]), ["referrer", document.referrer]].filter(([, value]) => value));
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        name: form.get("name"), email: form.get("email"), phone, message: form.get("message"), website: form.get("website"), source: location.pathname + location.hash, campaign,
      }) });
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || "Não foi possível enviar. Tente novamente.");
      setSent(true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); }
    finally { setBusy(false); }
  }
  return <div className="fixed right-4 bottom-4 z-40 flex flex-col items-end gap-3 sm:right-6 sm:bottom-6 print:hidden">
    {open && <div ref={panel} role="dialog" aria-modal="false" aria-labelledby="lead-title" className="w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-border/60 bg-card/95 text-card-foreground shadow-2xl backdrop-blur-xl">
      <header className="flex items-start justify-between gap-3 border-b border-border/60 px-5 py-4">
        <div><h2 id="lead-title" className="font-heading text-base font-semibold">Vamos conversar?</h2><p className="text-xs text-muted-foreground">Deixe seu contato e eu respondo o quanto antes.</p></div>
        <button type="button" aria-label="Fechar conversa" className="grid size-8 place-items-center rounded-full bg-muted/70 outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => setOpen(false)}><RiCloseLine className="size-5" /></button>
      </header>
      {sent ? <div className="grid justify-items-center gap-3 px-5 py-8 text-center" role="status">
        <span className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary"><RiCheckLine className="size-6" /></span>
        <p className="font-medium">Mensagem enviada!</p><p className="text-sm text-muted-foreground">Obrigado pelo contato. Retorno pelo e-mail ou telefone informado.</p>
        <Button variant="outline" size="sm" className="rounded-full normal-case tracking-normal" onClick={() => { setSent(false); setOpen(false); setPhone(""); }}>Fechar</Button>
      </div> : <form onSubmit={event => void submit(event)} className="grid max-h-[min(32rem,calc(100dvh-9rem))] gap-3 overflow-y-auto p-4">
        <Field label="Nome" required><Input name="name" autoComplete="name" required minLength={2} maxLength={120} /></Field>
        <Field label="E-mail" required><Input name="email" type="email" autoComplete="email" required maxLength={254} /></Field>
        <Field label="Telefone / WhatsApp"><Input name="phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="(00) 00000-0000" value={phone} onChange={event => setPhone(formatPhone(event.target.value))} /></Field>
        <Field label="Mensagem" required><textarea name="message" required minLength={5} maxLength={4000} rows={4} className="w-full resize-y rounded-xl border bg-background p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Conte sobre seu projeto ou ideia" /></Field>
        {/* Campo isca para robôs: escondido de pessoas e leitores de tela. */}
        <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] size-px opacity-0" />
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={busy} className="h-11 rounded-full normal-case tracking-normal text-sm font-medium">{busy ? <><RiLoader4Line className="animate-spin" />Enviando…</> : <><RiSendPlaneLine />Enviar mensagem</>}</Button>
        <p className="text-[11px] text-muted-foreground">Seus dados são usados só para responder este contato.</p>
      </form>}
    </div>}
    <button type="button" aria-expanded={open} aria-label={open ? "Fechar conversa" : "Abrir conversa"} onClick={() => setOpen(value => !value)}
      className="grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-xl outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none">
      {open ? <RiCloseLine className="size-6" /> : <RiChat3Line className="size-6" />}
    </button>
  </div>;
}

/** Botão que abre a conversa do site (mesmo formulário do botão flutuante). */
export function OpenLeadButton({ children, size, className }: { children: React.ReactNode; size?: "default" | "lg"; className?: string }) {
  return <Button type="button" size={size} className={className} onClick={() => window.dispatchEvent(new Event("viniszofx:open-lead"))}>{children}</Button>;
}
