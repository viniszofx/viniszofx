import type { Metadata } from "next";
import { WhiteboardEditor } from "@/components/nodus/whiteboards-page";
export const metadata: Metadata = { title: "Quadro branco | Viniccius" };
export default async function Route({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <WhiteboardEditor key={id} id={id} />; }
