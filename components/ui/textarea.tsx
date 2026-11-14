import * as React from "react"
import { cn } from "cn"
import { controlClassName } from "./control"

// Textarea do shadcn com a mesma aparência dos outros campos (control.ts).
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea data-slot="textarea" className={cn(controlClassName, "min-h-16 py-2", className)} {...props} />
}

export { Textarea }
