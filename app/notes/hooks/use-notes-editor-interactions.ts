"use client";

import type { Editor } from "@tiptap/react";
import { useCallback, useEffect, useRef, useState } from "react";

export type SlashItem = {
  id: string;
  label: string;
};

export function useNotesEditorInteractions(editor: Editor | null) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [showSlash, setShowSlash] = useState(false);
  const [slashPos, setSlashPos] = useState({ top: 0, left: 0 });
  const [activeIndex, setActiveIndex] = useState(0);
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPos, setToolbarPos] = useState({ top: 0, left: 0 });
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkValue, setLinkValue] = useState("");
  const linkInputRef = useRef<HTMLInputElement | null>(null);
  const linkPopupRef = useRef<HTMLDivElement | null>(null);

  const applyLink = useCallback(() => {
    if (!editor) return;
    if (!linkValue) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: linkValue })
        .run();
    }
    setShowLinkInput(false);
  }, [editor, linkValue]);

  useEffect(() => {
    if (!showLinkInput) return;
    window.setTimeout(() => linkInputRef.current?.focus(), 0);
  }, [showLinkInput]);

  const handleOpenLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href || "";
    setLinkValue(prev);
    setShowLinkInput(true);
  }, [editor]);

  useEffect(() => {
    if (!showLinkInput) return;

    function onPointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node | null;
      if (target && linkPopupRef.current?.contains(target)) return;
      setShowLinkInput(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowLinkInput(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [showLinkInput]);

  const slashItems: SlashItem[] = [
    { id: "h1", label: "Heading 1" },
    { id: "h2", label: "Heading 2" },
    { id: "bullet", label: "Bullet List" },
    { id: "ordered", label: "Numbered List" },
    { id: "quote", label: "Quote" },
    { id: "code", label: "Code Block" },
  ];

  function handleKeyUp() {
    try {
      const sel = window.getSelection();
      if (!sel || !sel.anchorNode) {
        setShowSlash(false);
        return;
      }
      const node = sel.anchorNode as Node;
      const text = node.textContent || "";
      if (text.endsWith("/")) {
        const range = sel.getRangeAt(0).getBoundingClientRect();
        setSlashPos({
          top: range.top + window.scrollY + 20,
          left: range.left + window.scrollX,
        });
        setActiveIndex(0);
        setShowSlash(true);
      } else {
        setShowSlash(false);
      }

      if (editor) {
        const { state } = editor;
        const { selection } = state;
        const $from = selection.$from;
        const start = $from.start();
        const before = state.doc.textBetween(start, $from.pos, "\n", "\n");
        const trimmed = before;
        if (/^###\s/.test(trimmed)) {
          const len = 4;
          const tr = editor.state.tr.delete(start, start + len);
          editor.view.dispatch(tr);
          editor.chain().focus().toggleHeading({ level: 3 }).run();
          return;
        }
        if (/^##\s/.test(trimmed)) {
          const len = 3;
          const tr = editor.state.tr.delete(start, start + len);
          editor.view.dispatch(tr);
          editor.chain().focus().toggleHeading({ level: 2 }).run();
          return;
        }
        if (/^#\s/.test(trimmed)) {
          const len = 2;
          const tr = editor.state.tr.delete(start, start + len);
          editor.view.dispatch(tr);
          editor.chain().focus().toggleHeading({ level: 1 }).run();
          return;
        }
        if (/^>\s/.test(trimmed)) {
          const len = 2;
          const tr = editor.state.tr.delete(start, start + len);
          editor.view.dispatch(tr);
          editor.chain().focus().toggleBlockquote().run();
          return;
        }
        if (/^(```)\s*$/.test(trimmed) || /^```/.test(trimmed)) {
          const len = 3;
          const tr = editor.state.tr.delete(start, start + len);
          editor.view.dispatch(tr);
          editor.chain().focus().toggleCodeBlock().run();
          return;
        }
        if (/^([-\*\+])\s/.test(trimmed)) {
          const len = 2;
          const tr = editor.state.tr.delete(start, start + len);
          editor.view.dispatch(tr);
          editor.chain().focus().toggleBulletList().run();
          return;
        }
        if (/^\d+\.\s/.test(trimmed)) {
          const match = trimmed.match(/^(\d+)\.\s/);
          const len = match ? match[0].length : 0;
          if (len > 0) {
            const tr = editor.state.tr.delete(start, start + len);
            editor.view.dispatch(tr);
            editor.chain().focus().toggleOrderedList().run();
            return;
          }
        }
      }
    } catch (e) {
      setShowSlash(false);
    }
  }

  function handleSelect(itemId: string) {
    if (!editor) return;
    try {
      const sel = editor.state.selection;
      const from = sel ? sel.from : null;
      if (from !== null && from > 0) {
        const tr = editor.state.tr.delete(from - 1, from);
        editor.view.dispatch(tr);
      }
    } catch (err) {
      // ignore
    }

    switch (itemId) {
      case "h1":
        editor.chain().focus().toggleHeading({ level: 1 }).run();
        break;
      case "h2":
        editor.chain().focus().toggleHeading({ level: 2 }).run();
        break;
      case "bullet":
        editor.chain().focus().toggleBulletList().run();
        break;
      case "ordered":
        editor.chain().focus().toggleOrderedList().run();
        break;
      case "quote":
        editor.chain().focus().toggleBlockquote().run();
        break;
      case "code":
        editor.chain().focus().toggleCodeBlock().run();
        break;
    }

    setShowSlash(false);
    editor.commands.focus();
  }

  useEffect(() => {
    if (!editor) return;
    const el = editorRef.current?.querySelector(
      ".ProseMirror",
    ) as HTMLElement | null;
    if (!el) return;
    el.style.caretColor =
      getComputedStyle(document.documentElement).getPropertyValue(
        "--notes-fg",
      ) || "inherit";
    el.style.color = "inherit";
    el.style.fontSize = "16px";
    el.style.lineHeight = "1.7";
    el.style.minHeight = "60vh";
  }, [editor]);

  useEffect(() => {
    if (!editor) return;

    function onSelectionChange() {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) {
        setShowToolbar(false);
        return;
      }
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (!rect) {
        setShowToolbar(false);
        return;
      }
      const anchor = sel.anchorNode;
      if (!anchor || !editorRef.current) {
        setShowToolbar(false);
        return;
      }
      if (!editorRef.current.contains(anchor)) {
        setShowToolbar(false);
        return;
      }

      setToolbarPos({
        top: rect.top + window.scrollY - 44,
        left: rect.left + window.scrollX,
      });
      setShowToolbar(true);
    }

    document.addEventListener("selectionchange", onSelectionChange);
    return () =>
      document.removeEventListener("selectionchange", onSelectionChange);
  }, [editor]);

  useEffect(() => {
    if (!showSlash) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, slashItems.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const item = slashItems[activeIndex];
        if (item) handleSelect(item.id);
      } else if (e.key === "Escape") {
        e.preventDefault();
        setShowSlash(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showSlash, activeIndex, slashItems]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        return;
      }

      const target = e.target as HTMLElement | null;
      const editorBody = editorRef.current?.querySelector(
        ".ProseMirror",
      ) as HTMLElement | null;
      if (!editor || !target || !editorBody || !editorBody.contains(target)) {
        return;
      }

      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;

      if (e.key.toLowerCase() === "b") {
        e.preventDefault();
        editor.chain().focus().toggleBold().run();
      } else if (e.key.toLowerCase() === "i") {
        e.preventDefault();
        editor.chain().focus().toggleItalic().run();
      } else if (e.key.toLowerCase() === "u") {
        e.preventDefault();
        editor.chain().focus().toggleUnderline().run();
      } else if (e.shiftKey && e.key.toLowerCase() === "x") {
        e.preventDefault();
        editor.chain().focus().toggleStrike().run();
      } else if (e.altKey && e.key.toLowerCase() === "c") {
        e.preventDefault();
        editor.chain().focus().toggleCode().run();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [editor]);

  return {
    editorRef,
    showSlash,
    slashPos,
    activeIndex,
    showToolbar,
    toolbarPos,
    showLinkInput,
    setShowLinkInput,
    linkValue,
    setLinkValue,
    linkInputRef,
    linkPopupRef,
    slashItems,
    handleKeyUp,
    handleSelect,
    handleOpenLink,
    applyLink,
  };
}
