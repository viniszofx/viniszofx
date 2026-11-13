import type { ComponentProps } from "react";
import { cn } from "cn";
import { controlClassName } from "./control";

function NativeSelect({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      data-slot="native-select"
      className={cn(
        controlClassName,
        "h-9 cursor-pointer appearance-none bg-(image:--chevron) bg-size-[1.125rem] bg-position-[right_0.5rem_center] bg-no-repeat pr-8",
        className,
      )}
      {...props}
    />
  );
}

export { NativeSelect };
