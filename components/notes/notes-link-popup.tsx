"use client";

import type { Editor } from "@tiptap/react";
import {
  Code2,
  Link2,
  MoreHorizontal,
  Sigma,
  Strikethrough,
} from "lucide-react";
import type { RefObject } from "react";
import styles from "../../app/notes/page.module.css";

type NotesLinkPopupProps = {
  editor: Editor | null;
  show: boolean;
  position: { top: number; left: number };
  linkValue: string;
  onChange: (value: string) => void;
  onApply: () => void;
  onClose: () => void;
  inputRef: RefObject<HTMLInputElement | null>;
  popupRef: RefObject<HTMLDivElement | null>;
};

export function NotesLinkPopup({
  editor,
  show,
  position,
  linkValue,
  onChange,
  onApply,
  onClose,
  inputRef,
  popupRef,
}: NotesLinkPopupProps) {
  if (!show) return null;

  return (
    <div
      ref={popupRef}
      className={styles.linkInputPopup}
      style={{ top: position.top + 40, left: position.left }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className={styles.linkToolbar}>
        <button
          className={styles.linkToolbarButton}
          type="button"
          aria-label="Apply link"
          onClick={onApply}
        >
          <Link2 size={16} />
        </button>
        <button
          className={styles.linkToolbarButton}
          type="button"
          aria-label="Strike"
          onClick={() => editor?.chain().focus().toggleStrike().run()}
        >
          <Strikethrough size={16} />
        </button>
        <button
          className={styles.linkToolbarButton}
          type="button"
          aria-label="Code"
          onClick={() => editor?.chain().focus().toggleCode().run()}
        >
          <Code2 size={16} />
        </button>
        <button
          className={styles.linkToolbarButton}
          type="button"
          aria-label="Equation"
          onClick={() => editor?.chain().focus().insertContent("∑").run()}
        >
          <Sigma size={16} />
        </button>
        <button
          className={styles.linkToolbarButton}
          type="button"
          aria-label="More"
          onClick={onClose}
        >
          <MoreHorizontal size={16} />
        </button>
      </div>
      <input
        ref={inputRef}
        className={styles.linkInput}
        value={linkValue}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste link or search pages"
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            onClose();
            return;
          }

          if (e.key === "Enter") {
            e.preventDefault();
            onApply();
          }
        }}
      />
    </div>
  );
}
