import type { Metadata } from "next";
import { ProposalEditor } from "@/components/proposals/proposal-editor";

export const metadata: Metadata = { title: "Proposta | Viniccius" };

export default async function ProposalRoute({ params }: { params: Promise<{ proposalId: string }> }) {
  const { proposalId } = await params;
  return <ProposalEditor proposalId={proposalId} />;
}
