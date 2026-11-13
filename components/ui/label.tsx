import type { ComponentProps } from "react";
import { cn } from "cn";

function Label({ className, ...props }: ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "grid gap-1.5 text-sm font-medium text-foreground has-disabled:cursor-not-allowed has-disabled:opacity-70",
        className,
      )}
      {...props}
    />
  );
}

export { Label };
