import type { Metadata } from "next";
import { JourneysPage } from "@/components/nodus/journeys-page";
export const metadata: Metadata = { title: "Jornadas | Viniccius" };
export default function Route() { return <JourneysPage />; }
