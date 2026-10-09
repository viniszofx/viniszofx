import type { Metadata } from "next";
import { ClientsPage } from "@/components/clients/clients-page";
export const metadata: Metadata = { title: "Clients | Viniccius" };
export default async function ClientsRoute({ searchParams }: { searchParams: Promise<{ client?: string | string[] }> }) {
  const { client } = await searchParams;
  const id = typeof client === "string" ? client : "";
  return <ClientsPage key={id} initialClientId={id} />;
}
