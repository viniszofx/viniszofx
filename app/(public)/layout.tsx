import { SiteHeader } from "@/components/site-header";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col pt-16">
      <SiteHeader />
      {children}
    </div>
  );
}
