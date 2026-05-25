"use client";

import type { Editor } from "@tiptap/react";
import { useCallback, useEffect, useRef, useState } from "react";

export function useNotesPersistence(editor: Editor | null) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const saveTimer = useRef<number | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("notes:content");
    if (raw && editor) {
      try {
        editor.commands.setContent(JSON.parse(raw));
      } catch (e) {
        // ignore
      }
    }

    const storedTitle = localStorage.getItem("notes:title");
    if (storedTitle) setTitle(storedTitle);
  }, [editor]);

  const save = useCallback(() => {
    if (editor) {
      const json = editor.getJSON();
      localStorage.setItem("notes:content", JSON.stringify(json));
    }
    localStorage.setItem("notes:title", title || "");
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }, [editor, title]);

  useEffect(() => {
    if (!editor) return;

    const onUpdate = () => {
      setSaving(true);
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(() => {
        try {
          const json = editor.getJSON();
          localStorage.setItem("notes:content", JSON.stringify(json));
          localStorage.setItem("notes:title", title || "");
        } catch (e) {
          // ignore
        }
        setSaving(false);
        setSaved(true);
        window.setTimeout(() => setSaved(false), 1200);
      }, 900);
    };

    editor.on("update", onUpdate);
    return () => {
      editor.off("update", onUpdate);
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [editor, title]);

  return {
    title,
    setTitle,
    saved,
    saving,
    save,
  };
}
