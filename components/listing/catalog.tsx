import type { CSSProperties, ReactNode } from "react";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export const catalogGrid = "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3";
export function CatalogLayout({ title, description, action, children }: { title: string; description: string; action?: ReactNode; children: ReactNode }) {
  return <main className="mx-auto flex w-full max-w-6xl flex-col gap-7 px-4 py-8 sm:px-6 sm:py-12"><header className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs uppercase tracking-widest text-primary">Workspace</p><h1 className="mt-2 font-heading text-3xl font-semibold">{title}</h1><p className="mt-2 text-sm text-muted-foreground">{description}</p></div>{action}</header>{children}</main>;
}
export function CatalogSearch({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="flex max-w-md items-center gap-2"><Search className="size-4 shrink-0" /><Input aria-label={label} placeholder={`${label}…`} value={value} onChange={event => onChange(event.target.value)} /></label>;
}
export function CatalogTile({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <article className="flex min-w-0 flex-col overflow-hidden rounded-none border bg-card" style={style}>{children}</article>;
}
export function CatalogPreview({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <span className="relative grid h-28 w-full place-items-center overflow-hidden bg-primary/10" style={style}>{children}</span>;
}
export function CatalogFooter({ children }: { children: ReactNode }) {
  return <footer className="mt-auto flex items-center justify-between gap-2 border-t px-4 py-2">{children}</footer>;
}
export function CatalogCreate({ label, disabled, onClick }: { label: string; disabled?: boolean; onClick: () => void }) {
  return <button disabled={disabled} onClick={onClick} className="flex min-h-44 items-center justify-center gap-2 rounded-none border bg-muted/40 text-sm text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"><Plus className="size-4" />{label}</button>;
}
export function CatalogSkeleton({ label }: { label: string }) {
  return <div role="status" aria-label={label} className={catalogGrid}>{[0, 1, 2].map(id => <div key={id} className="h-44 animate-pulse bg-muted" />)}</div>;
}
