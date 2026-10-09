import { getAttachment, listAttachments } from "./storage";
import { attachmentUrl, type Note } from "./types";

const filename = (title: string) => (title || "Sem título").replace(/[\\/:*?"<>|\r\n]/g, "-").replace(/[. ]+$/g, "").slice(0, 100) || "anotacao";
export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob), anchor = document.createElement("a");
  anchor.href = url; anchor.download = name; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
function dataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
export async function exportNote(note: Note, format: "md" | "json") {
  const metadata = await listAttachments(note.id);
  const attachments = await Promise.all(metadata.map(async (file) => {
    const stored = await getAttachment(file.id);
    if (!stored) throw new Error(`O anexo ${file.name} não está disponível.`);
    return { ...file, dataUrl: await dataUrl(stored.blob) };
  }));
  let content = note.content;
  let serialized = JSON.stringify(note.document);
  for (const file of attachments) {
    content = content.replaceAll(attachmentUrl(file.id), file.dataUrl);
    serialized = serialized.replaceAll(attachmentUrl(file.id), file.dataUrl);
  }
  const cover = attachments.find((file) => file.id === note.coverAttachmentId)?.dataUrl;
  const title = (note.title || "Sem título").replace(/[\r\n]/g, " ").replace(/([\\`*_[\]<>])/g, "\\$1");
  const output = format === "md"
    ? `${cover ? `![Capa](${cover})\n\n` : ""}# ${title}\n\n${content}\n`
    : JSON.stringify({ version: 1, note: { ...note, document: JSON.parse(serialized), content }, attachments }, null, 2);
  downloadBlob(new Blob([output], { type: format === "md" ? "text/markdown;charset=utf-8" : "application/json;charset=utf-8" }), `${filename(note.title)}.${format}`);
}
