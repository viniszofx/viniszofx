import { Extension, ReactRenderer } from "@tiptap/react";
import Suggestion, { exitSuggestion, type SuggestionProps } from "@tiptap/suggestion";
import { PluginKey } from "@tiptap/pm/state";
import { filteredCommands, runBlockCommand, type BlockCommand } from "./commands";
import { SlashMenuRenderer, type SlashMenuHandle } from "./slash-menu";
const slashKey = new PluginKey("note-slash-commands");
let menuSequence = 0;
export const SlashCommands = Extension.create({
  name: "noteSlashCommands",
  addProseMirrorPlugins() {
    const menuId = `note-slash-${++menuSequence}`;
    return [Suggestion<BlockCommand>({
      editor: this.editor, pluginKey: slashKey, char: "/", allowSpaces: true,
      allow: ({ editor, state }) => editor.isEditable && !editor.isActive("codeBlock") && !editor.isActive("code") && state.selection.$from.parent.isTextblock,
      items: ({ query }) => filteredCommands(query),
      command: ({ editor, range, props }) => { runBlockCommand(editor, props, range, (kind) => editor.view.dom.dispatchEvent(new CustomEvent("viniszofx:insert-file", { detail: kind }))); },
      render: () => {
        let component: ReactRenderer<SlashMenuHandle> | undefined;
        let current: SuggestionProps<BlockCommand>;
        let frame = 0;
        const position = () => {
          if (!component || !current) return;
          const rect = current.clientRect?.();
          if (!rect) return;
          const viewport = window.visualViewport;
          const left = viewport?.offsetLeft ?? 0, top = viewport?.offsetTop ?? 0;
          const width = viewport?.width ?? innerWidth, height = viewport?.height ?? innerHeight;
          const menuWidth = Math.min(320, width - 16);
          const menuHeight = Math.min(component.element.offsetHeight || 330, height - 16);
          Object.assign(component.element.style, { width: `${menuWidth}px`, left: `${Math.max(left + 8, Math.min(rect.left, left + width - menuWidth - 8))}px`, top: `${Math.max(top + 8, Math.min(rect.bottom + 6, top + height - menuHeight - 8))}px` });
        };
        const outside = (event: PointerEvent) => { if (component && event.target instanceof Node && !component.element.contains(event.target) && !current.editor.view.dom.contains(event.target)) exitSuggestion(current.editor.view, slashKey); };
        return {
          onStart: (props) => {
            current = props;
            component = new ReactRenderer(SlashMenuRenderer, { editor: props.editor, props: { ...props, menuId } });
            component.element.className = "fixed z-[100]";
            document.body.append(component.element);
            props.editor.view.dom.setAttribute("aria-controls", menuId);
            props.editor.view.dom.setAttribute("aria-expanded", "true");
            props.editor.view.dom.setAttribute("role", "combobox");
            props.editor.view.dom.setAttribute("aria-autocomplete", "list");
            position(); frame = requestAnimationFrame(position);
            window.addEventListener("scroll", position, true); window.addEventListener("resize", position);
            window.visualViewport?.addEventListener("resize", position);
            document.addEventListener("pointerdown", outside);
          },
          onUpdate: (props) => { current = props; component?.updateProps({ ...props, menuId }); position(); cancelAnimationFrame(frame); frame = requestAnimationFrame(position); },
          onKeyDown: ({ event, view }) => { if (event.isComposing) return false; if (event.key === "Escape") { exitSuggestion(view, slashKey); return true; } return component?.ref?.onKeyDown(event) ?? false; },
          onExit: () => {
            cancelAnimationFrame(frame); window.removeEventListener("scroll", position, true); window.removeEventListener("resize", position);
            window.visualViewport?.removeEventListener("resize", position); document.removeEventListener("pointerdown", outside);
            if (current && !current.editor.isDestroyed) {
              const dom = current.editor.view.dom; dom.removeAttribute("aria-controls"); dom.removeAttribute("aria-expanded"); dom.removeAttribute("aria-autocomplete"); dom.removeAttribute("aria-activedescendant"); dom.setAttribute("role", "textbox");
            }
            component?.element.remove(); component?.destroy(); component = undefined;
          },
        };
      },
    })];
  },
});
