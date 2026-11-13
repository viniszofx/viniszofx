import type { Metadata } from "next";
import { PublicDiagramPage } from "@/components/shared/public-views";
export const metadata: Metadata = { title: "Diagrama compartilhado", robots: { index: false, follow: false } };
export default async function Route({ params }: { params: Promise<{ token: string }> }) { const { token } = await params; return <PublicDiagramPage token={token} />; }
