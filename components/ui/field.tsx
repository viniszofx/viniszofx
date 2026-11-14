"use client";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export const selectClass = "h-10 w-full min-w-0 border border-transparent border-b-input bg-transparent text-base sm:text-sm outline-none focus-visible:border-b-ring [&>option]:bg-popover";
export const textareaClass = "min-h-24 w-full resize-y rounded-lg border bg-background p-3 text-base sm:text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** Label + control + optional hint, stacked. */
export function Field({ label, hint, required, className, children }: { label: ReactNode; hint?: ReactNode; required?: boolean; className?: string; children: ReactNode }) {
  return <label className={cn("grid min-w-0 content-start gap-1 text-sm", className)}>
    <span>{label}{required && " *"}</span>{children}
    {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
  </label>;
}

export type Option = { readonly value: string; readonly label: string };

export function Select({ options, placeholder, className, ...props }: ComponentProps<"select"> & { options: readonly Option[]; placeholder?: string }) {
  return <select className={cn(selectClass, className)} {...props}>
    {placeholder !== undefined && <option value="">{placeholder}</option>}
    {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
  </select>;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(textareaClass, className)} {...props} />;
}
