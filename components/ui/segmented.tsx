"use client";
import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Item<T extends string> = { value: T; label: string; icon?: ComponentType<{ className?: string }> };

/** Exclusive toggle group (e.g. grid/list, month/agenda). Icon-only when an icon is given. */
export function Segmented<T extends string>({ label, items, value, onChange }: { label: string; items: Item<T>[]; value: T; onChange: (value: T) => void }) {
  return <div className="flex rounded-full bg-foreground/6 p-0.5" role="group" aria-label={label}>{items.map(({ value: option, label: text, icon: Icon }) =>
    <button key={option} type="button" aria-pressed={value === option} aria-label={Icon ? text : undefined} title={text} onClick={() => onChange(option)}
      className={cn("rounded-full px-2.5 py-1 text-xs font-medium uppercase tracking-wider", value === option ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
      {Icon ? <Icon className="size-4" /> : text}
    </button>)}</div>;
}

/** Underlined tab strip; content is rendered by the caller. */
export function Tabs<T extends string>({ items, value, onChange }: { items: readonly { value: T; label: ReactNode }[]; value: T; onChange: (value: T) => void }) {
  return <div className="flex gap-1 overflow-x-auto border-b [scrollbar-width:none]" role="tablist">{items.map(item =>
    <button key={item.value} type="button" role="tab" aria-selected={value === item.value} onClick={() => onChange(item.value)}
      className={cn("-mb-px shrink-0 whitespace-nowrap border-b-2 px-3 py-2 text-sm sm:px-4", value === item.value ? "border-primary font-medium" : "border-transparent text-muted-foreground hover:text-foreground")}>{item.label}</button>)}</div>;
}
