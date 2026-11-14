import * as React from "react"
import { cn } from "cn"
import { controlClassName } from "./control"

// Textarea do shadcn com a mesma aparência dos outros campos (control.ts). Também exportado por field.tsx.
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea data-slot="textarea" className={cn(controlClassName, "min-h-24 resize-y py-2.5", className)} {...props} />
}

export { Textarea }
