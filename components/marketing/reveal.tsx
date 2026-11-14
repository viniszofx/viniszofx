"use client";
import { useEffect, useRef, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/utils";

// Estado escondido por variante de dado (data-reveal=hidden); motion-reduce mostra sem animar.
const revealClass = "transition-[opacity,transform,filter] duration-900 ease-[cubic-bezier(.2,.8,.2,1)] data-[reveal=hidden]:translate-y-7 data-[reveal=hidden]:scale-[.98] data-[reveal=hidden]:opacity-0 data-[reveal=hidden]:blur-md motion-reduce:transition-none motion-reduce:data-[reveal=hidden]:translate-y-0 motion-reduce:data-[reveal=hidden]:scale-100 motion-reduce:data-[reveal=hidden]:opacity-100 motion-reduce:data-[reveal=hidden]:blur-none";

/**
 * Revela o conteúdo ao entrar na tela (aparece subindo, saindo do desfoque).
 * Só esconde depois de montar no navegador, então sem JavaScript tudo aparece.
 */
export function Reveal({ children, delay = 0, as: Tag = "div", className, ...rest }: { children: ReactNode; delay?: number; as?: ElementType; className?: string } & Record<string, unknown>) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") return;
    const box = element.getBoundingClientRect();
    // Já visível ao carregar: não esconde (evita piscar).
    if (box.top < window.innerHeight * 0.92) return;
    element.dataset.reveal = "hidden";
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) { element.dataset.reveal = "shown"; observer.disconnect(); }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return <Tag ref={ref} className={cn(revealClass, className)} style={{ transitionDelay: `${delay}ms` }} {...rest}>{children}</Tag>;
}
