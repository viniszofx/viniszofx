"use client";

import styles from "../../app/notes/page.module.css";

export type SlashItem = {
  id: string;
  label: string;
};

type NotesSlashMenuProps = {
  show: boolean;
  position: { top: number; left: number };
  items: SlashItem[];
  activeIndex: number;
  onSelect: (itemId: string) => void;
};

export function NotesSlashMenu({
  show,
  position,
  items,
  activeIndex,
  onSelect,
}: NotesSlashMenuProps) {
  if (!show) return null;

  return (
    <div
      role="menu"
      className={styles.slashMenu}
      style={{ top: position.top, left: position.left }}
    >
      <div className={styles.slashHeader}>Basic blocks</div>
      {items.map((it, idx) => (
        <div
          key={it.id}
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(it.id);
          }}
          className={`${styles.slashItem} ${idx === activeIndex ? styles.activeItem : ""}`}
        >
          {it.label}
        </div>
      ))}
    </div>
  );
}
