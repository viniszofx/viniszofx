import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { cn } from "cn";

const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;
const PopoverClose = PopoverPrimitive.Close;

// Superfície flutuante padrão para menus e popovers.
const popoverSurfaceClassName =
  "max-w-[calc(100vw-2rem)] rounded-xl border border-border glass-surface text-popover-foreground shadow-lg outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95";

function PopoverContent({
  className,
  side,
  align,
  sideOffset = 6,
  collisionPadding,
  positionerClassName,
  ...props
}: PopoverPrimitive.Popup.Props & Pick<PopoverPrimitive.Positioner.Props, "side" | "align" | "sideOffset" | "collisionPadding"> & {
  positionerClassName?: string;
}) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner side={side} align={align} sideOffset={sideOffset} collisionPadding={collisionPadding} className={cn("z-100", positionerClassName)}>
        <PopoverPrimitive.Popup data-slot="popover-content" className={cn(popoverSurfaceClassName, "p-3", className)} {...props} />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
}

function PopoverTitle({ className, ...props }: PopoverPrimitive.Title.Props) {
  return <PopoverPrimitive.Title data-slot="popover-title" className={cn("text-sm font-semibold", className)} {...props} />;
}

export { Popover, PopoverClose, PopoverContent, PopoverTitle, PopoverTrigger };
