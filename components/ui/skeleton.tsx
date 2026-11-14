import { cn } from "cn"

// Skeleton do shadcn: bloco pulsante no lugar do conteúdo que ainda está carregando.
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="skeleton" aria-hidden="true" className={cn("animate-pulse rounded-md bg-muted motion-reduce:animate-none", className)} {...props} />
}

export { Skeleton }
