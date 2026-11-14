import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function LoadingBlock({ label, className }: { label: string; className?: string }) {
  return <div role="status" aria-label={label} className={cn("h-40 animate-pulse rounded-xl bg-muted motion-reduce:animate-none", className)} />;
}

export { Skeleton } from "./skeleton";

export function EmptyState({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("grid min-h-40 place-items-center text-center text-sm text-muted-foreground", className)}>{children}</p>;
}

/** Small outlined tag; `color` tints border and text. */
export function Badge({ children, color, className }: { children: ReactNode; color?: string; className?: string }) {
  return <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider", className)} style={color ? { borderColor: color, color } : undefined}>{children}</span>;
}
