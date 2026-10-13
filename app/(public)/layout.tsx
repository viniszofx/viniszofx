import { SiteHeader } from "@/components/site-header";
import { auth } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const { data } = await auth.getSession();
  return (
    <div className="flex min-h-screen flex-col pt-16">
      <SiteHeader authenticated={Boolean(data?.user)} />
      {children}
    </div>
  );
}
