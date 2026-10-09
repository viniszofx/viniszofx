export function NotesSkeleton({ label = "Carregando anotações…" }: { label?: string }) {
  return <div role="status" className="grid gap-4 py-6"><span className="sr-only">{label}</span>
    <div className="h-7 w-48 animate-pulse bg-muted" /><div className="h-24 w-full animate-pulse bg-muted" /><div className="h-5 w-3/4 animate-pulse bg-muted" />
  </div>;
}
