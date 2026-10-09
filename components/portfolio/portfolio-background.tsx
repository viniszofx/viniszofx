export function PortfolioBackground() {
  return <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden select-none">
    <div className="absolute inset-x-0 top-0 h-[1000px] opacity-30 dark:opacity-20" style={{ backgroundImage: "linear-gradient(to right, color-mix(in srgb, var(--primary) 18%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in srgb, var(--primary) 18%, transparent) 1px, transparent 1px)", backgroundSize: "80px 80px", maskImage: "linear-gradient(to bottom, black, transparent 90%)" }} />
    <div className="absolute -right-40 -top-48 h-[650px] w-[850px] opacity-40 dark:opacity-60" style={{ background: "radial-gradient(ellipse at center, color-mix(in srgb, var(--primary) 20%, transparent), transparent 65%)" }} />
    <div className="absolute -left-40 top-[1100px] h-[700px] w-[600px] opacity-30 dark:opacity-40" style={{ background: "radial-gradient(ellipse at center, color-mix(in srgb, var(--primary) 14%, transparent), transparent 70%)" }} />
    <div className="absolute -right-32 top-20 h-48 w-[750px] -rotate-35 opacity-25 dark:opacity-45" style={{ background: "linear-gradient(to bottom, transparent 35%, color-mix(in srgb, var(--primary) 14%, transparent) 49%, color-mix(in srgb, var(--primary) 65%, transparent) 50%, color-mix(in srgb, var(--primary) 8%, transparent) 51%, transparent 75%)", maskImage: "linear-gradient(to right, transparent, black 25%, black 65%, transparent)" }} />
    <div className="absolute -right-40 top-56 h-40 w-[600px] -rotate-35 opacity-15 dark:opacity-30" style={{ background: "linear-gradient(to bottom, transparent 48%, color-mix(in srgb, var(--primary) 50%, transparent) 50%, transparent 52%)", maskImage: "linear-gradient(to right, transparent, black 30%, transparent)" }} />
    <div className="absolute bottom-24 left-0 h-px w-full bg-linear-to-r from-transparent via-primary/25 to-transparent" />
  </div>;
}
