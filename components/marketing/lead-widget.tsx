"use client";
import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { RiArrowUpLine, RiChat3Line, RiCheckDoubleLine, RiCloseLine, RiRefreshLine, RiRobot2Line } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { formatPhone } from "@/lib/employees/profile";
import { cn } from "@/lib/utils";

const campaignKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
const glass = "border border-foreground/10 bg-card/80 backdrop-blur-2xl backdrop-saturate-150 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.15),0_30px_80px_-30px_rgb(0_0_0/0.55)] dark:border-white/10 dark:bg-card/70";

type Step = "topic" | "name" | "email" | "phone" | "message" | "confirm" | "sending" | "done";
type Bubble = { id: number; from: "bot" | "user"; text: ReactNode };
type Lead = { topic: string; name: string; email: string; phone: string; message: string };
const topics = ["Quero um orçamento", "Não sei bem o que preciso", "Tenho uma dúvida"];
const placeholders: Partial<Record<Step, string>> = { name: "Seu nome", email: "seu@email.com", phone: "(00) 00000-0000", message: "Ex.: controlo os pedidos numa planilha e sempre algo se perde" };
const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? "";

/**
 * Botão flutuante de conversa (bot): pergunta uma coisa por vez e, no fim,
 * envia o contato como lead para Marketing › Leads.
 */
export function LeadWidget() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("topic");
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const [lead, setLead] = useState<Lead>({ topic: "", name: "", email: "", phone: "", message: "" });
  const [trap, setTrap] = useState("");
  const counter = useRef(0);
  const timers = useRef<number[]>([]);
  const log = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);

  const push = useCallback((from: Bubble["from"], text: ReactNode) => setBubbles(previous => [...previous, { id: ++counter.current, from, text }]), []);
  // O bot "digita" um instante antes de cada fala.
  const say = useCallback((lines: ReactNode[], then?: () => void) => {
    setTyping(true);
    lines.forEach((line, index) => {
      timers.current.push(window.setTimeout(() => {
        push("bot", line);
        if (index === lines.length - 1) { setTyping(false); then?.(); }
      }, 550 + index * 650));
    });
  }, [push]);

  const restart = useCallback(() => {
    timers.current.forEach(clearTimeout); timers.current = [];
    setBubbles([]); setInput(""); setLead({ topic: "", name: "", email: "", phone: "", message: "" }); setStep("topic");
    say(["Olá! 👋 Sou o assistente do Vinicius.", "Posso te ajudar a tirar uma ideia do papel. Sobre o que você quer conversar?"]);
  }, [say]);

  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener("viniszofx:open-lead", show);
    return () => window.removeEventListener("viniszofx:open-lead", show);
  }, []);
  // Primeira abertura: começa a conversa.
  useEffect(() => {
    if (open && !bubbles.length && !typing) { const timer = window.setTimeout(restart, 0); return () => clearTimeout(timer); }
  }, [open, bubbles.length, typing, restart]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => { log.current?.scrollTo({ top: log.current.scrollHeight, behavior: "smooth" }); }, [bubbles, typing]);
  useEffect(() => { if (open && !typing) field.current?.focus(); }, [open, typing, step]);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);

  function chooseTopic(topic: string) {
    if (typing || step !== "topic") return;
    push("user", topic); setLead(previous => ({ ...previous, topic }));
    say([topic === topics[1] ? "Sem problema, é para isso que serve a conversa. Como posso te chamar?" : "Ótimo! Para começar, como posso te chamar?"], () => setStep("name"));
  }

  async function send(data: Lead) {
    setStep("sending"); setTyping(true);
    const params = new URLSearchParams(location.search);
    const campaign = Object.fromEntries([...campaignKeys.map(key => [key, params.get(key) ?? ""]), ["referrer", document.referrer]].filter(([, value]) => value));
    try {
      const response = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        name: data.name, email: data.email, phone: data.phone, message: data.topic ? `[${data.topic}] ${data.message}` : data.message, website: trap, source: location.pathname + location.hash, campaign,
      }) });
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || "Não consegui enviar agora.");
      setTyping(false);
      say([`Pronto, ${firstName(data.name)}! Sua mensagem chegou. ✅`, `Vou responder pelo e-mail ${data.email}${data.phone ? " ou pelo WhatsApp" : ""} o quanto antes.`], () => setStep("done"));
    } catch (cause) {
      setTyping(false);
      say([`${cause instanceof Error ? cause.message : "Algo deu errado."} Quer tentar de novo?`], () => setStep("confirm"));
    }
  }

  function answer(event?: FormEvent) {
    event?.preventDefault();
    if (typing) return;
    const value = input.trim();
    if (step === "name") {
      if (value.length < 2) return say(["Me diz seu nome, por favor. 🙂"]);
      push("user", value); setInput(""); setLead(previous => ({ ...previous, name: value }));
      return say([`Prazer, ${firstName(value)}! Qual é o seu melhor e-mail para eu responder?`], () => setStep("email"));
    }
    if (step === "email") {
      if (!/^\S+@\S+\.\S+$/.test(value)) { if (value) push("user", value); setInput(""); return say(["Esse e-mail parece incompleto. Pode conferir? (ex.: nome@empresa.com)"]); }
      push("user", value); setInput(""); setLead(previous => ({ ...previous, email: value.toLowerCase() }));
      return say(["Anotado! Tem um WhatsApp para contato? É opcional, pode pular."], () => setStep("phone"));
    }
    if (step === "phone") {
      if (value && value.replace(/\D/g, "").length < 10) return say(["Coloque o número com DDD, por favor. Ou toque em Pular."]);
      push("user", value || "Prefiro não informar"); setInput(""); setLead(previous => ({ ...previous, phone: value }));
      return say(["Perfeito. Agora me conta como funciona hoje e o que mais incomoda. Pode ser do seu jeito, sem termos técnicos."], () => setStep("message"));
    }
    if (step === "message") {
      if (value.length < 5) return say(["Escreve um pouquinho mais sobre como funciona hoje. 🙂"]);
      push("user", value); setInput("");
      const next = { ...lead, message: value }; setLead(next);
      return say([<Summary key="summary" lead={next} />, "Posso enviar?"], () => setStep("confirm"));
    }
  }

  const inputStep = step === "name" || step === "email" || step === "phone" || step === "message";
  return <div className="fixed right-4 bottom-4 z-40 [--primary:oklch(0.76_0.1_58)] [--primary-foreground:oklch(0.2_0.02_50)] [--ring:oklch(0.76_0.1_58)] flex flex-col items-end gap-3 sm:right-6 sm:bottom-6 print:hidden">
    {open && <section role="dialog" aria-label="Conversa com o assistente" className={cn(glass, "flex h-[min(36rem,calc(100dvh-7rem))] w-[min(24rem,calc(100vw-2rem))] origin-bottom-right animate-rise-in flex-col overflow-hidden rounded-3xl motion-reduce:animate-none")}>
      <header className="flex items-center gap-3 border-b border-foreground/10 px-4 py-3">
        <span className="relative grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"><RiRobot2Line className="size-5" /><span className="absolute right-0 bottom-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-card" /></span>
        <div className="min-w-0 flex-1"><h2 className="text-sm font-semibold">Assistente do Vinicius</h2><p className="text-xs text-muted-foreground">{typing ? "digitando…" : "Online · responde em instantes"}</p></div>
        <button type="button" aria-label="Recomeçar conversa" title="Recomeçar" className="grid size-8 place-items-center rounded-full text-muted-foreground outline-none hover:bg-foreground/5 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring" onClick={restart}><RiRefreshLine className="size-4" /></button>
        <button type="button" aria-label="Fechar conversa" className="grid size-8 place-items-center rounded-full text-muted-foreground outline-none hover:bg-foreground/5 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring" onClick={() => setOpen(false)}><RiCloseLine className="size-5" /></button>
      </header>

      <div ref={log} role="log" aria-live="polite" className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-4 py-4">
        {bubbles.map(bubble => <div key={bubble.id} className={cn("flex animate-rise-in motion-reduce:animate-none", bubble.from === "user" ? "justify-end" : "justify-start")}>
          <div className={cn("max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-6 break-words whitespace-pre-wrap", bubble.from === "user" ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-foreground/[0.06] dark:bg-white/[0.07]")}>{bubble.text}</div>
        </div>)}
        {typing && <div className="flex justify-start" aria-label="digitando"><div className="flex gap-1 rounded-2xl rounded-bl-md bg-foreground/[0.06] px-3.5 py-3 dark:bg-white/[0.07]">{[0, 150, 300].map(delay => <span key={delay} className="size-1.5 animate-bounce rounded-full bg-muted-foreground motion-reduce:animate-none" style={{ animationDelay: `${delay}ms` }} />)}</div></div>}
        {step === "topic" && !typing && <div className="mt-1 flex flex-wrap justify-end gap-2">{topics.map(topic => <button key={topic} type="button" onClick={() => chooseTopic(topic)} className="rounded-full border border-primary/40 px-3.5 py-1.5 text-sm text-primary outline-none hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring">{topic}</button>)}</div>}
        {step === "confirm" && !typing && <div className="mt-1 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={() => { push("user", "Quero corrigir"); restart(); }} className="rounded-full border border-foreground/15 px-3.5 py-1.5 text-sm outline-none hover:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-ring">Corrigir</button>
          <button type="button" onClick={() => { push("user", "Pode enviar!"); void send(lead); }} className="rounded-full bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring">Enviar</button>
        </div>}
        {step === "done" && !typing && <div className="mt-1 flex justify-end"><button type="button" onClick={() => setOpen(false)} className="inline-flex items-center gap-1.5 rounded-full border border-foreground/15 px-3.5 py-1.5 text-sm outline-none hover:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-ring"><RiCheckDoubleLine className="size-4" />Fechar</button></div>}
      </div>

      <form onSubmit={answer} className="border-t border-foreground/10 p-3">
        {/* Campo isca para robôs: escondido de pessoas e leitores de tela. */}
        <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" value={trap} onChange={event => setTrap(event.target.value)} className="absolute -left-[9999px] size-px opacity-0" />
        <div className="flex items-end gap-2 rounded-2xl border border-foreground/10 bg-background/60 p-1.5 pl-3.5 focus-within:border-primary/50">
          <textarea ref={field} rows={1} aria-label="Sua resposta" disabled={!inputStep || typing}
            placeholder={inputStep ? placeholders[step] : step === "topic" ? "Escolha uma opção acima" : step === "done" ? "Conversa encerrada" : "…"}
            inputMode={step === "email" ? "email" : step === "phone" ? "tel" : "text"} maxLength={step === "message" ? 4000 : 254}
            value={input} onChange={event => setInput(step === "phone" ? formatPhone(event.target.value) : event.target.value)}
            onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); answer(); } }}
            className="max-h-32 min-h-9 flex-1 resize-none bg-transparent py-1.5 text-base outline-none sm:text-sm [field-sizing:content] placeholder:text-muted-foreground disabled:cursor-not-allowed" />
          {step === "phone" && !input && !typing && <button type="button" onClick={() => answer()} className="h-9 shrink-0 rounded-full px-3 text-sm text-muted-foreground hover:text-foreground">Pular</button>}
          <button type="submit" aria-label="Enviar resposta" disabled={!inputStep || typing || (!input.trim() && step !== "phone")} className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground outline-none transition-opacity hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"><RiArrowUpLine className="size-5" /></button>
        </div>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">Seus dados são usados só para responder este contato.</p>
      </form>
    </section>}
    <button type="button" aria-expanded={open} aria-label={open ? "Fechar conversa" : "Abrir conversa"} onClick={() => setOpen(value => !value)}
      className="group relative grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_16px_40px_-12px_color-mix(in_srgb,var(--primary)_70%,transparent)] outline-none transition-transform duration-300 hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none">
      {!open && <span aria-hidden="true" className="absolute inset-0 animate-ping rounded-full bg-primary/40 [animation-duration:2.5s] motion-reduce:hidden" />}
      {open ? <RiCloseLine className="relative size-6" /> : <RiChat3Line className="relative size-6" />}
    </button>
  </div>;
}

function Summary({ lead }: { lead: Lead }) {
  return <span className="block space-y-1">
    <span className="block font-medium">Confere se está tudo certo:</span>
    <span className="block">👤 {lead.name}</span>
    <span className="block">✉️ {lead.email}</span>
    {lead.phone && <span className="block">📱 {lead.phone}</span>}
    {lead.topic && <span className="block">🏷️ {lead.topic}</span>}
    <span className="block">💬 {lead.message}</span>
  </span>;
}

/** Botão que abre a conversa do site (o mesmo bot do botão flutuante). */
export function OpenLeadButton({ children, size, className }: { children: React.ReactNode; size?: "default" | "lg"; className?: string }) {
  return <Button type="button" size={size} className={className} onClick={() => window.dispatchEvent(new Event("viniszofx:open-lead"))}>{children}</Button>;
}
