import type { Metadata } from "next";
import { AgendaPage } from "@/components/nodus/agenda-page";
export const metadata: Metadata = { title: "Agenda para WhatsApp | Viniccius" };
export default function Route() { return <AgendaPage />; }
