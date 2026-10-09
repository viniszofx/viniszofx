"use client";
import { createContext, useContext, type ReactNode } from "react";
import { RiArrowDownSLine } from "@remixicon/react";
import { useSectionPreferences } from "@/lib/ui/section-preferences";
const SectionPreferencesContext = createContext<ReturnType<typeof useSectionPreferences> | null>(null);
export function SectionPreferencesProvider({ storageKey, children }: { storageKey: string; children: ReactNode }) {
 const preferences = useSectionPreferences(storageKey);
 return <SectionPreferencesContext.Provider value={preferences}>{children}</SectionPreferencesContext.Provider>;
}
export function useFieldSections() { return useContext(SectionPreferencesContext); }
export function CollapsibleFields({ title, children }: { title: string; children: ReactNode }) {
 const preferences = useFieldSections();
 return <details open={preferences?.isOpen(title) ?? true} onToggle={event => preferences?.setOpen(title, event.currentTarget.open)} className="group/fields min-w-0 border-t pt-4"><summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">{title}<RiArrowDownSLine aria-hidden="true" className="size-4 shrink-0 -rotate-90 transition-transform group-open/fields:rotate-0" /></summary><div className="mt-4 min-w-0 space-y-4">{children}</div></details>;
}
