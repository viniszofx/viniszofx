import { ImageResponse } from "next/og";

// Ícone da tela inicial do iPhone (o iOS não aceita SVG aqui): a mesma marca de app/icon.svg, em PNG.
// Sem cantos arredondados: o próprio iOS recorta o ícone.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#000" }}>
      <svg width="128" height="128" viewBox="0 0 32 32">
        <path d="M6 7h5.5L16 19.5 20.5 7H26l-7.5 18h-5z" fill="#fff" />
        <rect x="22" y="21" width="4" height="4" fill="#fe7141" />
      </svg>
    </div>,
    size,
  );
}
