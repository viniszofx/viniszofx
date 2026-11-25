import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Revela o conteúdo ao entrar na tela (sobe um pouco e aparece). Só CSS, sem JavaScript: a animação segue a rolagem
 * (classe .reveal em globals.css, animation-timeline: view()) e roda na placa de vídeo. Navegadores sem suporte
 * e "reduzir movimento" mostram o conteúdo direto.
 */
export function Reveal({ children, as: Tag = "div", className, ...rest }: { children: ReactNode; as?: ElementType; className?: string } & Record<string, unknown>) {
  return <Tag className={cn("reveal", className)} {...rest}>{children}</Tag>;
}
