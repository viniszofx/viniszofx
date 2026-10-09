"use client";
import type { ReactNode } from "react";
import { Toast } from "@base-ui/react/toast";
import { RiCheckboxCircleLine, RiErrorWarningLine, RiCloseLine } from "@remixicon/react";
import { toastManager } from "@/lib/ui/notifications";
import { Button } from "./button";
import { menuSurfaceClass } from "./menu-styles";
function ToastList() {
  const { toasts } = Toast.useToastManager();
  return <Toast.Portal><Toast.Viewport className="pointer-events-none fixed bottom-4 right-4 z-[200] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3 outline-none" aria-label="Notificações">
    {toasts.map(toast => <Toast.Root key={toast.id} toast={toast} data-notification-type={toast.type} className={`pointer-events-auto flex items-start gap-3 border p-4 transition-opacity data-ending-style:opacity-0 data-limited:hidden motion-reduce:transition-none ${menuSurfaceClass}`}>
      {toast.type === "error" ? <RiErrorWarningLine className="mt-0.5 size-5 shrink-0 text-destructive" /> : <RiCheckboxCircleLine className="mt-0.5 size-5 shrink-0 text-primary" />}
      <Toast.Content className="min-w-0 flex-1"><Toast.Title className="break-words text-sm font-semibold" />{toast.description && <Toast.Description className="mt-1 break-words text-xs leading-5 text-muted-foreground" />}</Toast.Content>
      <Toast.Close render={<Button variant="ghost" size="icon-xs" aria-label="Fechar notificação" />}><RiCloseLine /></Toast.Close>
    </Toast.Root>)}
  </Toast.Viewport></Toast.Portal>;
}
export function AppToasts({ children }: { children: ReactNode }) {
  return <Toast.Provider toastManager={toastManager} limit={3}>{children}<ToastList /></Toast.Provider>;
}
