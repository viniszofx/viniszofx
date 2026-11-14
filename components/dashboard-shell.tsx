"use client";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ModulesProvider } from "@/lib/modules-context";
import { Dialog } from "@base-ui/react/dialog";
import { RiSidebarUnfoldLine as PanelLeftOpen } from "@remixicon/react";
import { usePathname } from "next/navigation";
import { useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import { DashboardNavigation } from "./dashboard/shell/dashboard-navigation";
import { DesktopAppsGallery, MobileMenuSheet } from "./dashboard/shell/apps";
import { ModuleGate } from "./dashboard/shell/module-gate";
import { MobileTabBar } from "./dashboard/shell/mobile-tab-bar";

const MIN_WIDTH = 204;
const MAX_WIDTH = 320;
const CLOSE_THRESHOLD = 96;
export function DashboardShell({ children, isPlatformAdmin = false, disabledModules = [] }: { children: ReactNode; isPlatformAdmin?: boolean; disabledModules?: string[] }) {
  const pathname = usePathname();
  const [width, setWidth] = useState(224);
  const [isResizing, setIsResizing] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [appsOpen, setAppsOpen] = useState(false);
  const drag = useRef<{ x: number; width: number } | null>(null);

  function resize(value: number) {
    setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, value)));
  }

  function startResize(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, width };
    setIsResizing(true);
  }

  function stopResize() {
    drag.current = null;
    setIsResizing(false);
  }

  return (
    <div
      style={{ "--sidebar-width": `${width}px` } as CSSProperties}
      className={cn(
        // Sem fundo próprio: a luz ambiente do body (globals.css) aparece por trás do vidro.
        "dashboard-shell flex min-h-svh flex-col",
        isResizing && "cursor-col-resize select-none",
      )}
    >
      <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
        <DashboardHeader
          menuButton={
            <>

              {!desktopOpen && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden md:inline-flex"
                  aria-label="Mostrar menu lateral"
                  aria-expanded={false}
                  aria-controls="dashboard-sidebar"
                  onClick={() => setDesktopOpen(true)}
                >
                  <PanelLeftOpen aria-hidden="true" />
                </Button>
              )}
            </>
          }
        />
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/40 md:hidden transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0" />
          <MobileMenuSheet isPlatformAdmin={isPlatformAdmin} disabledModules={disabledModules} onClose={() => setMobileOpen(false)} />
        </Dialog.Portal>
        <MobileTabBar menuOpen={mobileOpen} messages={!disabledModules.includes("messages")} />
      </Dialog.Root>
      <DesktopAppsGallery open={appsOpen} onOpenChange={setAppsOpen} isPlatformAdmin={isPlatformAdmin} disabledModules={disabledModules} />
      <div className="flex min-w-0 flex-1">
        <aside
          id="dashboard-sidebar"
          aria-label="Menu do dashboard"
          className={cn(
            "relative hidden shrink-0 border-r glass-bar text-sidebar-foreground md:sticky md:top-[57px] md:h-[calc(100svh-57px)] md:w-(--sidebar-width)",
            desktopOpen ? "md:block" : "md:hidden",
          )}
        >
          <div className="flex h-full flex-col gap-4 p-3">
            <DashboardNavigation onHide={() => setDesktopOpen(false)} onOpenApps={() => setAppsOpen(true)} isPlatformAdmin={isPlatformAdmin} disabledModules={disabledModules} />
          </div>
          <div
            role="separator"
            tabIndex={0}
            aria-label="Redimensionar menu lateral"
            aria-controls="dashboard-sidebar"
            aria-orientation="vertical"
            aria-valuemin={MIN_WIDTH}
            aria-valuemax={MAX_WIDTH}
            aria-valuenow={width}
            onPointerDown={startResize}
            onPointerMove={(event) => {
              if (!drag.current) return;
              const nextWidth =
                drag.current.width + event.clientX - drag.current.x;
              if (nextWidth <= CLOSE_THRESHOLD) {
                stopResize();
                setDesktopOpen(false);
                event.currentTarget.releasePointerCapture(event.pointerId);
                return;
              }
              resize(nextWidth);
            }}
            onPointerUp={(event) => {
              stopResize();
              if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                event.currentTarget.releasePointerCapture(event.pointerId);
              }
            }}
            onPointerCancel={stopResize}
            onLostPointerCapture={stopResize}
            onDoubleClick={() => {
              stopResize();
              setDesktopOpen(false);
            }}
            onKeyDown={(event) => {
              if (
                !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
              )
                return;
              event.preventDefault();
              if (event.key === "Home") resize(MIN_WIDTH);
              else if (event.key === "End") resize(MAX_WIDTH);
              else resize(width + (event.key === "ArrowRight" ? 16 : -16));
            }}
            className="absolute inset-y-0 -right-1 z-10 hidden w-2 touch-none cursor-col-resize items-center justify-center outline-none hover:bg-primary/10 focus-visible:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring md:flex"
          >
            <span
              aria-hidden="true"
              className="h-10 w-1 rounded-full bg-sidebar-foreground/15"
            />
          </div>
        </aside>
        <div className={cn("min-w-0 flex-1 md:pb-0", pathname.startsWith("/dashboard/drive") ? "pb-[calc(6.5rem+env(safe-area-inset-bottom))]" : "pb-[calc(3.5rem+env(safe-area-inset-bottom))]")}><ModulesProvider disabled={disabledModules}><ModuleGate disabledModules={disabledModules}>{children}</ModuleGate></ModulesProvider></div>
      </div>
    </div>
  );
}
