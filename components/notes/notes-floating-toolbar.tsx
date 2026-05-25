"use client";

import type { Editor } from "@tiptap/react";
import {
  Bold,
  Code2,
  Italic,
  Link2,
  Pilcrow,
  Strikethrough,
  Underline as UnderlineIcon,
} from "lucide-react";
import styles from "../../app/notes/page.module.css";

type NotesFloatingToolbarProps = {
  editor: Editor | null;
  show: boolean;
  position: { top: number; left: number };
  onOpenLink: () => void;
};

export function NotesFloatingToolbar({
  editor,
  show,
  position,
  onOpenLink,
}: NotesFloatingToolbarProps) {
  if (!show) return null;

  return (
    <div
      className={styles.floatingToolbar}
      style={{ top: position.top, left: position.left }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <button
        onClick={() =>
          editor?.chain().focus().toggleHeading({ level: 1 }).run()
        }
        className={styles.toolButton}
        title="Heading 1"
      >
        <Pilcrow size={16} />
      </button>
      <button
        onClick={() => editor?.chain().focus().toggleBold().run()}
        className={styles.toolButton}
        title="Bold"
      >
        <Bold size={16} />
      </button>
      <button
        onClick={() => editor?.chain().focus().toggleItalic().run()}
        className={styles.toolButton}
        title="Italic"
      >
        <Italic size={16} />
      </button>
      <button
        onClick={() => editor?.chain().focus().toggleUnderline().run()}
        className={styles.toolButton}
        title="Underline"
      >
        <UnderlineIcon size={16} />
      </button>
      <button
        onClick={() => editor?.chain().focus().toggleCode().run()}
        className={styles.toolButton}
        title="Code"
      >
        <Code2 size={16} />
      </button>
      <button onClick={onOpenLink} className={styles.toolButton} title="Link">
        <Link2 size={16} />
      </button>
      <button
        onClick={() => editor?.chain().focus().toggleStrike().run()}
        className={styles.toolButton}
        title="Strike"
      >
        <Strikethrough size={16} />
      </button>
    </div>
  );
}
