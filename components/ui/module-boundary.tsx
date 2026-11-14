"use client";
import { Component, type ReactNode } from "react";
import { RiErrorWarningLine, RiRefreshLine } from "@remixicon/react";
import { cn } from "@/lib/utils";

type Props = { children: ReactNode; title: string; className?: string };

/**
 * Isola um módulo da tela: se ele quebrar ao renderizar, só o cartão dele vira um aviso
 * com "Tentar de novo"; os outros módulos continuam funcionando.
 */
export class ModuleBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: unknown) { console.error(`[${this.props.title}]`, error); }
  render() {
    if (!this.state.failed) return this.props.children;
    return <ModuleError title={this.props.title} className={this.props.className} onRetry={() => this.setState({ failed: false })} />;
  }
}

/** Aviso de falha de um módulo, no mesmo formato de cartão dos painéis. */
export function ModuleError({ title, message = "Não foi possível mostrar esta parte agora.", onRetry, className }: { title: string; message?: string; onRetry?: () => void; className?: string }) {
  return <section role="alert" className={cn("min-w-0 border bg-card", className)}>
    <header className="border-b px-4 py-2"><h3 className="text-sm font-semibold">{title}</h3></header>
    <div className="flex items-center gap-3 px-4 py-3 text-xs text-muted-foreground">
      <RiErrorWarningLine className="size-4 shrink-0 text-destructive" aria-hidden="true" /><p className="min-w-0 flex-1">{message}</p>
      {onRetry && <button type="button" onClick={onRetry} className="inline-flex shrink-0 items-center gap-1 text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"><RiRefreshLine className="size-3.5" aria-hidden="true" />Tentar de novo</button>}
    </div>
  </section>;
}
