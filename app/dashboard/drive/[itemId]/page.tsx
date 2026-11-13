import type { Metadata } from "next";
import { DriveFilePage } from "@/components/drive/file-page";
export const metadata: Metadata = { title: "Arquivo | Drive" };
export default async function Route({ params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await params;
  return <DriveFilePage key={itemId} itemId={itemId} />;
}
