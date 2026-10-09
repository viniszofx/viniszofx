import type { Metadata } from "next";
import { SearchPage } from "@/components/search/search-page";
export const metadata: Metadata = { title: "Busca global | Viniccius" };
export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const { q } = await searchParams;
  return <SearchPage query={typeof q === "string" ? q : ""} />;
}
