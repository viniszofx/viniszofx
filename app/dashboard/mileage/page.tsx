import type { Metadata } from "next";
import { MileagePage } from "@/components/nodus/modules";
export const metadata: Metadata = { title: "Lançamentos de KM | Viniccius" };
export default function Route() { return <MileagePage />; }
