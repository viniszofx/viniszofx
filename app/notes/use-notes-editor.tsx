"use client";

import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useNotesActions } from "./hooks/use-notes-actions";
import { useNotesEditorInteractions } from "./hooks/use-notes-editor-interactions";
import { useNotesPersistence } from "./hooks/use-notes-persistence";

export function useNotesEditor() {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: true }),
      Placeholder.configure({
        placeholder: "Type '/' for blocks or start writing...",
      }),
    ],
    content: "",
  });

  const persistence = useNotesPersistence(editor);
  const actions = useNotesActions(editor, persistence.title);
  const interactions = useNotesEditorInteractions(editor);

  return {
    editor,
    ...persistence,
    ...actions,
    ...interactions,
  };
}
