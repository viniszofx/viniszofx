import { ImageResponse } from "next/og";

// Ícone da tela inicial do iPhone (o iOS não aceita SVG aqui): a mesma marca de app/icon.svg, em PNG.
// Sem cantos arredondados: o próprio iOS recorta o ícone.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#1b1e22" }}>
      <div style={{ width: 132, height: 132, display: "flex", alignItems: "center", justifyContent: "center", border: "8px solid #d39a6c", borderRadius: 28 }}>
        <svg width="76" height="76" viewBox="0 0 32 32">
          <path d="M8 8 16 24 24 8" fill="none" stroke="#e7b48a" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>,
    size,
  );
}
