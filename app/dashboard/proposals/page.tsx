import type { Metadata } from "next";
import { Suspense } from "react";
import { ProposalsPage } from "@/components/proposals/proposals-page";

export const metadata: Metadata = { title: "Propostas | Viniccius" };

// Suspense: a lista lê ?novo=1 (vindo de um lead) com useSearchParams.
export default function ProposalsRoute() {
  return <Suspense><ProposalsPage /></Suspense>;
}
