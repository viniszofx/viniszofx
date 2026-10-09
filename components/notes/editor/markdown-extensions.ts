import { NoteFileBlock } from "./note-file-extension";
import { NoteEmbed } from "./note-embed-extension";
import { NoteColumns, NoteColumn } from "./blocks/columns";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import { tableExtensions } from "./table-extensions";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { NoteImage } from "./note-image";

export function markdownExtensions(editable: boolean, extended = false) {
  return [
    StarterKit.configure({ link: { openOnClick: !editable, HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" } } }),
    ...(extended ? [NoteColumns, NoteColumn, NoteEmbed, NoteFileBlock, ...tableExtensions(editable), TaskList, TaskItem.configure({ nested: true, HTMLAttributes: { "data-type": "taskItem" } }), NoteImage.configure({ allowBase64: false })] : []),
    Markdown,
  ];
}
