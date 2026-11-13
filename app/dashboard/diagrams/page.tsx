import type { Metadata } from "next";
import { DiagramsPage } from "@/components/nodus/diagrams-page";
export const metadata: Metadata = { title: "Diagramas | Viniccius" };
export default function Route() { return <DiagramsPage />; }
