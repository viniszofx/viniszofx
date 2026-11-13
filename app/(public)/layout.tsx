import { SiteHeader } from "@/components/site-header";
import { auth } from "@/lib/auth/server";
import { disabledModules } from "@/lib/modules-server";

export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [{ data }, disabled] = await Promise.all([auth.getSession(), disabledModules()]);
  return (
    <div className="flex min-h-screen flex-col pt-16">
      <SiteHeader authenticated={Boolean(data?.user)} blog={!disabled.includes("blog")} />
      {children}
    </div>
  );
}
