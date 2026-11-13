import type { Metadata } from "next";
import { CalendarPage } from "@/components/nodus/calendar-page";
export const metadata: Metadata = { title: "Calendário | Viniccius" };
export default function Route() { return <CalendarPage />; }
