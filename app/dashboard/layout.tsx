import { DashboardShell } from "@/components/dashboard-shell";

import { AppToasts } from "@/components/ui/app-toasts";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AppToasts><DashboardShell>{children}</DashboardShell></AppToasts>;
}
