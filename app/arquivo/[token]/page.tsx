import type { Metadata } from "next";
import { SharedFilePage } from "@/components/drive/shared-file-page";
export const metadata: Metadata = { title: "Arquivo compartilhado", robots: { index: false, follow: false } };
export default async function Route({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <SharedFilePage token={token} />;
}
