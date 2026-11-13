import type { Metadata } from "next";
import { TasksPage } from "@/components/nodus/modules";
export const metadata: Metadata = { title: "Tarefas | Viniccius" };
export default function Route() { return <TasksPage />; }
