import type { Metadata } from "next";
import { RequestsPage } from "@/components/nodus/modules";
export const metadata: Metadata = { title: "Solicitações | Viniccius" };
export default function Route() { return <RequestsPage />; }
