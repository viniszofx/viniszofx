import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { listAdSlots } from "@/lib/blog/ads";
import { AdManager } from "@/components/blog/ad-manager";

export const metadata: Metadata = { title: "Publicidade | Viniccius" };

export default async function AdsPage() {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/login");
  return <AdManager initial={await listAdSlots(session.user.id)} />;
}
