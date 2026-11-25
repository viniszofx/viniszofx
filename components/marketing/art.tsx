import { cn } from "@/lib/utils";

/*
 * Padrões da identidade editorial (docs/brand/README.md, seção 5). Desenhados na cor do texto (currentColor),
 * sem degradê nem transparência: só quadrados cheios, como pixels de um gráfico impresso. Foco à direita.
 */

const fades = { down: "linear-gradient(to bottom, black, transparent)", right: "linear-gradient(to right, transparent 40%, black)" };

/**
 * Meio-tom de pixels ("dados"): quadrados que crescem em direção a um foco à direita. É um arquivo estático
 * (public/brand/pixels.svg, ~18 KB, em cache) usado como máscara sobre a cor do texto: antes eram ~380 <rect>
 * repetidos no HTML de cada página. "fade" soma um degradê à máscara (as duas máscaras se cruzam).
 */
export function PixelField({ className, fade }: { className?: string; fade?: keyof typeof fades }) {
  const mask = ["url(/brand/pixels.svg) right center / cover no-repeat", ...(fade ? [fades[fade]] : [])].join(", ");
  return <div aria-hidden="true" className={cn("pointer-events-none bg-current", className)} style={{ mask, maskComposite: "intersect" }} />;
}

/** Trilho de etapas ("processos"): uma linha com marcos quadrados, o último cheio. */
export function StepRail({ className, steps = 6 }: { className?: string; steps?: number }) {
  const gap = 200;
  return <svg aria-hidden="true" className={cn("pointer-events-none", className)} preserveAspectRatio="xMaxYMid slice" viewBox={`0 0 ${(steps + 1) * gap} 200`} fill="none" stroke="currentColor" strokeWidth={2}>
    {/* Linha em trechos entre os marcos, para os marcos vazios não precisarem de fundo. */}
    <path d={Array.from({ length: steps + 1 }, (_, index) => `M${index === 0 ? 0 : index * gap + 14} 100H${index === steps ? (steps + 1) * gap : (index + 1) * gap - 14}`).join("")} />
    {Array.from({ length: steps }, (_, index) => { const x = (index + 1) * gap; return <rect key={x} x={x - 14} y={86} width={28} height={28} fill={index === steps - 1 ? "currentColor" : "none"} />; })}
  </svg>;
}
