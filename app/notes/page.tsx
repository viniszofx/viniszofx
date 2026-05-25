"use client";

import { EditorContent } from "@tiptap/react";
import { NotesFloatingToolbar } from "../../components/notes/notes-floating-toolbar";
import { NotesHeader } from "../../components/notes/notes-header";
import { NotesLinkPopup } from "../../components/notes/notes-link-popup";
import { NotesSlashMenu } from "../../components/notes/notes-slash-menu";
import styles from "./page.module.css";
import { useNotesEditor } from "./use-notes-editor";

export default function Page() {
  const notes = useNotesEditor();

  return (
    <main className={styles.root}>
      <div className={styles.container}>
        <div className={styles.header} />

        <div ref={notes.editorRef} className={styles.editorArea}>
          <div
            className={styles.card}
            onKeyUp={notes.handleKeyUp}
            onMouseDown={(e) => {
              const target = e.target as HTMLElement | null;
              if (
                target?.closest(`.${styles.cardHeaderInner}`) ||
                target?.closest("input") ||
                target?.closest("button")
              ) {
                return;
              }
              if (!notes.editor) return;
              const text = notes.editor.getText();
              if (!text || text.length === 0) {
                notes.editor
                  .chain()
                  .focus()
                  .insertContent({ type: "paragraph" })
                  .run();
                setTimeout(() => {
                  try {
                    const endPos = notes.editor.state.doc.content.size;
                    notes.editor.commands.setTextSelection(endPos);
                    notes.editor.commands.focus();
                  } catch (err) {
                    notes.editor.commands.focus();
                  }
                }, 0);
                return;
              }
              setTimeout(() => notes.editor.commands.focus(), 0);
            }}
          >
            <NotesHeader
              title={notes.title}
              saving={notes.saving}
              saved={notes.saved}
              onTitleChange={notes.setTitle}
              onSave={notes.save}
              onPrint={notes.printReceipt}
              onCopy={notes.copyToClipboard}
            />

            {notes.editor ? (
              <EditorContent editor={notes.editor} className={styles.prose} />
            ) : (
              <div>Loading editor...</div>
            )}
          </div>

          <NotesFloatingToolbar
            editor={notes.editor}
            show={notes.showToolbar}
            position={notes.toolbarPos}
            onOpenLink={notes.handleOpenLink}
          />

          <NotesLinkPopup
            editor={notes.editor}
            show={notes.showLinkInput}
            position={notes.toolbarPos}
            linkValue={notes.linkValue}
            onChange={notes.setLinkValue}
            onApply={notes.applyLink}
            onClose={() => notes.setShowLinkInput(false)}
            inputRef={notes.linkInputRef}
            popupRef={notes.linkPopupRef}
          />

          <NotesSlashMenu
            show={notes.showSlash}
            position={notes.slashPos}
            items={notes.slashItems}
            activeIndex={notes.activeIndex}
            onSelect={notes.handleSelect}
          />
        </div>
      </div>
    </main>
  );
}
