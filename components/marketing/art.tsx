import { cn } from "@/lib/utils";

/** Filetes em losango para os blocos escuros (processo e contato). Usam a cor do texto (currentColor). */
export function DiamondLines({ className }: { className?: string }) {
  return <svg aria-hidden="true" className={cn("pointer-events-none", className)} preserveAspectRatio="xMaxYMid slice" viewBox="0 0 1200 400">
    {[180, 300, 420, 540, 660].map((size, index) => <rect key={size} x={960 - size / 2} y={200 - size / 2} width={size} height={size} transform="rotate(45 960 200)" fill="none" stroke="currentColor" strokeOpacity={0.45 - index * 0.07} strokeWidth={index === 0 ? 1.5 : 1} />)}
  </svg>;
}
