import type { Metadata } from "next";
import { PublicBoardPage } from "@/components/shared/public-views";
export const metadata: Metadata = { title: "Quadro compartilhado", robots: { index: false, follow: false } };
export default async function Route({ params }: { params: Promise<{ token: string }> }) { const { token } = await params; return <PublicBoardPage token={token} />; }
