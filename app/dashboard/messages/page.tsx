import type { Metadata } from "next";
import { MessagesPage } from "@/components/nodus/messages-page";
export const metadata: Metadata = { title: "Mensagens | Viniccius" };
export default function Route() { return <MessagesPage />; }
