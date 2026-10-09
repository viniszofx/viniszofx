import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { AttachmentDownload } from "../attachment-download";
import { FilePreview } from "../file-preview";
import { useAttachment } from "../use-attachment";
export function FileBlock({ node }: NodeViewProps) {
  const file = useAttachment(node.attrs.href);
  return <NodeViewWrapper data-note-attachment className="my-4 min-w-0 border border-border bg-card p-4" contentEditable={false}>
    <div className="flex flex-wrap items-center justify-between gap-3"><span className="min-w-0 break-words text-sm font-medium">{node.attrs.name}</span><AttachmentDownload href={node.attrs.href} name={node.attrs.name} className="text-sm text-primary underline">Baixar arquivo</AttachmentDownload></div>
    {file.file && <div className="mt-3"><FilePreview file={file.file} url={node.attrs.href} /></div>}
    {file.error && <p className="mt-2 text-xs text-destructive">{file.error}</p>}
  </NodeViewWrapper>;
}
