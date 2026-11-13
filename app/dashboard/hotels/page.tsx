import type { Metadata } from "next";
import { HotelsPage } from "@/components/nodus/modules";
export const metadata: Metadata = { title: "Hotéis | Viniccius" };
export default function Route() { return <HotelsPage />; }
