import type { Metadata } from "next";
import { BoardsPage } from "@/components/boards/boards-page";
export const metadata: Metadata = { title: "Boards | Viniccius" };
export default function Page() { return <BoardsPage />; }
