import { cn } from "@/lib/utils";

/** Padrão 01 da marca (losangos concêntricos), no bloco de contato. Usa a cor do texto (currentColor). */
export function DiamondLines({ className }: { className?: string }) {
  return <svg aria-hidden="true" className={cn("pointer-events-none", className)} preserveAspectRatio="xMaxYMid slice" viewBox="0 0 1200 400">
    {[180, 300, 420, 540, 660].map((size, index) => <rect key={size} x={960 - size / 2} y={200 - size / 2} width={size} height={size} transform="rotate(45 960 200)" fill="none" stroke="currentColor" strokeOpacity={0.45 - index * 0.07} strokeWidth={index === 0 ? 1.5 : 1} />)}
  </svg>;
}

/**
 * Losangos em fila (docs/brand/assets/Fundos/05-losangos-em-fila-escuro.svg): losangos do mesmo tamanho encadeados
 * na horizontal, como as etapas de um processo. Sem fundo próprio, na cor do texto (currentColor), com a mesma
 * opacidade por losango do arquivo da marca; foco à direita.
 */
const chain = [0.261, 0.392, 0.522, 0.652, 0.522, 0.392, 0.261, 0.131, 0.087];
export function DiamondChain({ className }: { className?: string }) {
  return <svg aria-hidden="true" className={cn("pointer-events-none", className)} preserveAspectRatio="xMaxYMid slice" viewBox="0 0 1200 640">
    {chain.map((opacity, index) => { const cx = 510 + index * 130; return <rect key={cx} x={cx - 110} y={210} width={220} height={220} transform={`rotate(45 ${cx} 320)`} fill="none" stroke="currentColor" strokeOpacity={opacity} strokeWidth={index === 3 ? 1.5 : 1} strokeLinejoin="round" />; })}
  </svg>;
}
