import type { Metadata } from "next";
import { OrdersPage } from "@/components/nodus/modules";
export const metadata: Metadata = { title: "Ordens de serviço | Viniccius" };
export default async function Route({ searchParams }: { searchParams: Promise<{ order?: string | string[] }> }) {
  const { order } = await searchParams;
  const id = typeof order === "string" ? order : "";
  return <OrdersPage key={id} initialId={id} />;
}
