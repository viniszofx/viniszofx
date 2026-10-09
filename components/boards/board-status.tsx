import { boardStatus, type BoardStatus } from "@/lib/boards/status";
export function BoardStatusBadge({ status }: { status?: BoardStatus }) {
  const current = boardStatus(status);
  const colors = current.value === "cancelled" ? "border-destructive/20 bg-destructive/10 text-destructive" : current.value === "started" || current.value === "completed" ? "border-primary/20 bg-primary/10 text-primary" : "border-border bg-muted/40 text-muted-foreground";
  return <span aria-label={`Status: ${current.label}`} className={`inline-flex shrink-0 items-center border px-2 py-1 text-xs ${colors}`}>{current.label}</span>;
}
