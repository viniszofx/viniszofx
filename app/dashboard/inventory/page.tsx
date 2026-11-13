import type { Metadata } from "next";
import { InventoryPage } from "@/components/nodus/inventory-page";
export const metadata: Metadata = { title: "Inventário | Viniccius" };
export default function Route() { return <InventoryPage />; }
