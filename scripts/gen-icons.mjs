// Gera components/icons.tsx com só os ícones Remix usados por componentes de cliente do site público.
// Uso (na raiz do projeto): node scripts/gen-icons.mjs
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as Remix from "@remixicon/react";
import { writeFileSync } from "node:fs";

const names = [
  "RiArrowLeftLine", "RiArrowUpLine", "RiBuilding2Line", "RiChat3Line", "RiCheckDoubleLine", "RiCloseLine",
  "RiComputerLine", "RiErrorWarningLine", "RiHome4Line", "RiMailLine", "RiMenuLine", "RiMessage2Line",
  "RiMoonLine", "RiPhoneLine", "RiPriceTag3Line", "RiRefreshLine", "RiRobot2Line", "RiSunLine", "RiUserLine",
];

const icons = names.map(name => {
  const Icon = Remix[name];
  if (!Icon) throw new Error(`Ícone não encontrado: ${name}`);
  const markup = renderToStaticMarkup(createElement(Icon));
  const inner = markup.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
  if (!inner.startsWith("<path")) throw new Error(`Formato inesperado em ${name}: ${inner.slice(0, 40)}`);
  const paths = [...inner.matchAll(/<path d="([^"]+)"\s*\/?>(?:<\/path>)?/g)].map(match => match[1]);
  if (!paths.length) throw new Error(`Sem path em ${name}`);
  const body = paths.map(d => `<path d="${d}" />`).join("");
  return `export const ${name} = (props: IconProps) => <Icon {...props}>${body}</Icon>;`;
});

const file = `// Ícones Remix (Remix Icon License 1.0) copiados de @remixicon/react, só os usados por componentes de cliente
// do site público. O pacote traz todos os ícones num único arquivo (~160 KB), que nenhum compilador consegue
// enxugar: um único ícone num componente de cliente fazia o navegador baixar todos.
// Servidor pode continuar importando de "@remixicon/react" (não vai para o navegador).
// Para acrescentar um ícone: acrescente o nome em scripts/gen-icons.mjs e rode o script, ou copie o <path> do pacote.
import type { SVGProps } from "react";

export type IconProps = SVGProps<SVGSVGElement> & { size?: number | string; color?: string };

function Icon({ size = 24, color = "currentColor", className, children, ...props }: IconProps) {
  return <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill={color} {...props} className={"remixicon " + (className ?? "")}>{children}</svg>;
}

${icons.join("\n")}
`;
writeFileSync("components/icons.tsx", file);
console.log(`${names.length} ícones, ${file.length} bytes`);
