"use client";
import { useState } from "react";
import { DocxEditor, useDocxEditor, useEditorValueCommand } from "@docx-editor.dev/react";
import {
  type RemixiconComponentType,
  RiBringToFront,
  RiClosedCaptioningLine,
  RiEqualizerLine,
  RiImageLine,
  RiLayoutLeftLine,
  RiLayoutMasonryLine,
  RiLayoutRightLine,
  RiLayoutTopLine,
  RiSendToBack,
  RiTextWrap,
  RiCollapseHorizontalLine,
} from "@remixicon/react";

const WRAP_LABELS: Record<string, string> = {
  inline: "Alinhado ao texto",
  square: "Quadrado",
  squareLeft: "Quadrado à esquerda",
  squareRight: "Quadrado à direita",
  tight: "Justo",
  through: "Através",
  topAndBottom: "Superior e inferior",
  behind: "Atrás do texto",
  inFront: "Na frente do texto",
};

const WRAP_ICONS: Record<string, RemixiconComponentType> = {
  inline: RiImageLine,
  square: RiLayoutMasonryLine,
  squareLeft: RiLayoutLeftLine,
  squareRight: RiLayoutRightLine,
  tight: RiCollapseHorizontalLine,
  through: RiTextWrap,
  topAndBottom: RiLayoutTopLine,
  behind: RiSendToBack,
  inFront: RiBringToFront,
};

function wrapIcon(option: string) {
  const Icon = WRAP_ICONS[option] ?? RiImageLine;
  return <Icon className="size-[18px]" />;
}

const captionIcon = <RiClosedCaptioningLine className="size-[18px]" />;
const propertiesIcon = <RiEqualizerLine className="size-[18px]" />;

// A barra padrão do editor não mostra os comandos de imagem. Ficam num menu próprio, ativos só com uma imagem selecionada.
function useImageActions() {
  const editor = useDocxEditor();
  const wrap = useEditorValueCommand("image.wrap");
  const fontSize = useEditorValueCommand("font.size");
  const [properties, setProperties] = useState(false);
  const disabledReason = wrap.disabledReason ?? undefined;

  // O editor não grava o campo de numeração do Word pela API pública, então o número é escrito como texto.
  function addCaption() {
    if (!editor) return;
    const image = editor.getSelectedImage();
    const object = editor.findMatches("￼").filter((match) => image?.id.startsWith(`${match.blockId}.`)).at(-1);
    if (!object) return;
    const numbers = editor.findMatches("Figura ").map((match) => Number(/^\d+/.exec(match.contextAfter ?? "")?.[0] ?? 0));
    const label = `Figura ${Math.max(0, ...numbers) + 1} – `;
    const caret = { paragraphId: object.blockId, offset: object.start + object.length };
    editor.exec({ type: "setSelection", range: { anchor: caret, head: caret } });
    editor.focus();
    // A API não expõe a quebra de parágrafo; o Enter é o gesto que o próprio editor trata.
    document.activeElement?.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", code: "Enter", bubbles: true, cancelable: true }));
    editor.exec({ type: "insertText", text: label });
    const inserted = editor.findMatches(label).at(-1);
    if (inserted) {
      editor.selectMatch(inserted);
      editor.exec({ type: "toggleMark", mark: "italic" });
      fontSize.execute(18);
      const end = { paragraphId: inserted.blockId, offset: inserted.start + inserted.length };
      editor.exec({ type: "setSelection", range: { anchor: end, head: end } });
    }
    editor.focus();
  }

  return { wrap, disabledReason, addCaption, properties, setProperties };
}

export function DocxImageMenu() {
  const { wrap, disabledReason, addCaption, properties, setProperties } = useImageActions();
  return (
    <>
      <DocxEditor.Menu.Menu id="image" label="Imagem" preset={false}>
        <DocxEditor.Menu.Row icon={captionIcon} disabled={!wrap.isEnabled} title={disabledReason} onSelect={addCaption}>Legenda</DocxEditor.Menu.Row>
        <DocxEditor.Menu.Submenu label="Disposição do texto">
          {wrap.options.map((option) => (
            <DocxEditor.Menu.Row
              key={option}
              icon={wrapIcon(option)}
              disabled={!wrap.isEnabled}
              title={disabledReason}
              selected={wrap.value === option ? true : undefined}
              onSelect={() => wrap.execute(option)}
            >
              {WRAP_LABELS[option] ?? option}
            </DocxEditor.Menu.Row>
          ))}
        </DocxEditor.Menu.Submenu>
        <DocxEditor.Menu.Row icon={propertiesIcon} disabled={!wrap.isEnabled} title={disabledReason} onSelect={() => setProperties(true)}>
          Propriedades e texto alternativo…
        </DocxEditor.Menu.Row>
      </DocxEditor.Menu.Menu>
      <DocxEditor.ImagePropertiesDialog open={properties} onClose={() => setProperties(false)} />
    </>
  );
}

const CONTEXT_WRAPS = ["inline", "square", "topAndBottom", "behind", "inFront"] as const;

// O menu do botão direito traz os comandos de imagem; os de tabela somem enquanto há uma imagem selecionada, mesmo dentro de célula.
export function DocxContextMenu() {
  const { wrap, addCaption, properties, setProperties } = useImageActions();
  const image = wrap.isEnabled;
  const Menu = DocxEditor.ContextMenu;
  return (
    <>
      <Menu className="[&_[role=separator]+[role=separator]]:hidden">
        <Menu.InsertRowAbove hidden={image} />
        <Menu.InsertRowBelow hidden={image} />
        <Menu.InsertColumnLeft hidden={image} />
        <Menu.InsertColumnRight hidden={image} />
        <Menu.MergeCells hidden={image} />
        <Menu.SplitCell hidden={image} />
        <Menu.DeleteTableRow hidden={image} />
        <Menu.DeleteTableColumn hidden={image} />
        <Menu.DeleteTable hidden={image} />
        <Menu.CellVerticalAlignment hidden={image} />
        {image && <Menu.Item icon={captionIcon} label="Legenda" onSelect={addCaption} />}
        {image && <Menu.Item icon={propertiesIcon} label="Propriedades e texto alternativo…" onSelect={() => setProperties(true)} />}
        {image && CONTEXT_WRAPS.map((option) => (
          <Menu.Item
            key={option}
            icon={wrapIcon(option)}
            label={`Disposição: ${WRAP_LABELS[option]}`}
            active={wrap.value === option}
            onSelect={() => wrap.execute(option)}
          />
        ))}
      </Menu>
      <DocxEditor.ImagePropertiesDialog open={properties} onClose={() => setProperties(false)} />
    </>
  );
}
