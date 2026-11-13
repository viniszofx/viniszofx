import { useId } from "react";
import { RiFile3Fill, RiFileExcel2Fill, RiFilePdf2Fill, RiFileWord2Fill, RiImageFill, RiMusic2Fill, RiVideoFill } from "@remixicon/react";
import { FOLDER_COLORS, previewKind, type FolderColor } from "@/lib/drive/files";

const FILE_ICONS = {
  docx: { icon: RiFileWord2Fill, color: "#2b6cdf" },
  sheet: { icon: RiFileExcel2Fill, color: "#1d8f5a" },
  pdf: { icon: RiFilePdf2Fill, color: "#e5484d" },
  image: { icon: RiImageFill, color: "#8e6bd8" },
  video: { icon: RiVideoFill, color: "#e5734d" },
  audio: { icon: RiMusic2Fill, color: "#e0559a" },
  text: { icon: RiFile3Fill, color: "#8a94a6" },
  none: { icon: RiFile3Fill, color: "#8a94a6" },
} as const;

export function FolderIcon({ color, className }: { color?: FolderColor; className: string }) {
  const id = useId();
  const [top, bottom] = FOLDER_COLORS[color ?? "blue"].shades;
  return <svg viewBox="0 0 64 52" aria-hidden="true" className={className}>
    <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={top} /><stop offset="1" stopColor={bottom} /></linearGradient></defs>
    <path d="M6 2h17c2 0 3.2.7 4.4 2.2L31 9h27a6 6 0 0 1 6 6v3H0V8a6 6 0 0 1 6-6Z" fill={bottom} />
    <rect y="12" width="64" height="40" rx="6" fill={`url(#${id})`} />
  </svg>;
}

export function ItemIcon({ item, className }: { item: { kind: "folder" | "file"; name: string; color?: FolderColor }; className: string }) {
  if (item.kind === "folder") return <FolderIcon color={item.color} className={className} />;
  const { icon: Icon, color } = FILE_ICONS[previewKind(item.name)];
  return <Icon className={className} style={{ color }} aria-hidden="true" />;
}
