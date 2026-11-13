import type { Metadata } from "next";
import { WhiteboardsPage } from "@/components/nodus/whiteboards-page";
export const metadata: Metadata = { title: "Quadro branco | Viniccius" };
export default function Route() { return <WhiteboardsPage />; }
