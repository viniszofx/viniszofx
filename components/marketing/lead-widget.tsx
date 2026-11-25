"use client";
import dynamic from "next/dynamic";
import { useEffect, useState, type ReactNode } from "react";
import { RiChat3Line, RiCloseLine } from "@/components/icons";

// O chat (formulário, validação, envio) só é baixado no primeiro clique: a página não paga por ele ao carregar.
const LeadChat = dynamic(() => import("./lead-chat"), { ssr: false });

/** Botão flutuante de conversa. Abre o chat (LeadChat), que continua montado depois de fechado para não perder a conversa. */
export function LeadWidget() {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const show = (value: boolean) => { setOpen(value); if (value) setLoaded(true); };
  useEffect(() => {
    const listener = () => show(true);
    window.addEventListener("viniszofx:open-lead", listener);
    return () => window.removeEventListener("viniszofx:open-lead", listener);
  }, []);
  return <div className="fixed right-4 bottom-4 z-40 [--primary:var(--orange)] [--primary-foreground:#000] flex flex-col items-end gap-3 sm:right-6 sm:bottom-6 print:hidden">
    {loaded && <LeadChat open={open} onClose={() => setOpen(false)} />}
    <button type="button" aria-expanded={open} aria-label={open ? "Fechar conversa" : "Abrir conversa"} onClick={() => show(!open)}
      className="group relative grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_16px_40px_-12px_color-mix(in_srgb,var(--primary)_70%,transparent)] outline-none transition-transform duration-300 hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none">
      {!open && <span aria-hidden="true" className="absolute inset-0 animate-ping rounded-full bg-primary/40 [animation-duration:2.5s] motion-reduce:hidden" />}
      {open ? <RiCloseLine className="relative size-6" /> : <RiChat3Line className="relative size-6" />}
    </button>
  </div>;
}

/** Botão que abre a conversa do site (o mesmo bot do botão flutuante). A classe vem pronta do servidor (buttonVariants + cn). */
export function OpenLeadButton({ children, className }: { children: ReactNode; className: string }) {
  return <button type="button" className={className} onClick={() => window.dispatchEvent(new Event("viniszofx:open-lead"))}>{children}</button>;
}
