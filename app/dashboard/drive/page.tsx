import type { Metadata } from "next";
import { DrivePage, type DriveView } from "@/components/drive/drive-page";
export const metadata: Metadata = { title: "Drive | Viniccius" };
type Props = { searchParams: Promise<{ view?: string | string[]; folder?: string | string[] }> };
export default async function Route({ searchParams }: Props) {
  const { view, folder } = await searchParams;
  const section: DriveView = view === "recent" || view === "links" || view === "shared" || view === "public" ? view : "drive";
  return <DrivePage view={section} folderId={section === "drive" && typeof folder === "string" ? folder : ""} />;
}
