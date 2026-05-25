"use client";

import { Circle, Clipboard, Printer } from "lucide-react";
import styles from "../../app/notes/page.module.css";

type NotesHeaderProps = {
  title: string;
  saving: boolean;
  saved: boolean;
  onTitleChange: (value: string) => void;
  onSave: () => void;
  onPrint: () => void;
  onCopy: () => void;
};

export function NotesHeader({
  title,
  saving,
  saved,
  onTitleChange,
  onSave,
  onPrint,
  onCopy,
}: NotesHeaderProps) {
  return (
    <div className={styles.cardHeaderInner}>
      <input
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="Untitled"
        className={styles.cardTitle}
        onMouseDown={(e) => e.stopPropagation()}
      />
      <div className={styles.cardControls}>
        <div
          className={styles.statusIndicator}
          title={saving ? "Saving" : saved ? "Saved" : "Unsaved"}
          aria-label={saving ? "Saving" : saved ? "Saved" : "Unsaved"}
        >
          <Circle
            size={10}
            fill={saving ? "#f59e0b" : saved ? "#22c55e" : "#9ca3af"}
            stroke="none"
          />
        </div>
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={onSave}
          className={styles.saveButton}
          title="Save note"
          aria-label="Save note"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M4 4.5A2.5 2.5 0 0 1 6.5 2h10l3.5 3.5V19.5A2.5 2.5 0 0 1 17.5 22h-11A2.5 2.5 0 0 1 4 19.5v-15Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <path
              d="M7 2v6h10V2"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <path
              d="M8 14h8"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <path
              d="M8 17h5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <path
              d="M15.5 2.2V7"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={onPrint}
          className={styles.iconButton}
          title="Print receipt"
          aria-label="Print receipt"
        >
          <Printer size={16} />
        </button>
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={onCopy}
          className={styles.iconButton}
          title="Copy note to clipboard"
          aria-label="Copy note to clipboard"
        >
          <Clipboard size={16} />
        </button>
      </div>
    </div>
  );
}
