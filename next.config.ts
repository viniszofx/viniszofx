import type { NextConfig } from "next";

// Node built-ins imported (lazily, Node-only) by @docx-editor.dev/core/export; empty in the browser.
const nodeOnly = { browser: "./lib/browser/empty-module.ts" };

const nextConfig: NextConfig = {
  // 75 é o padrão; 90 fica para as fotos da página inicial, de fundo preto, onde 75 cria blocos e faixas nas sombras.
  images: { qualities: [75, 90] },
  // Keep the dev server's generated manifests and Turbopack state separate from builds.
  distDir: process.env.NEXT_DIST_DIR || (process.env.NODE_ENV === "development" ? ".next-dev" : ".next"),
  // The Docker image sets NEXT_OUTPUT=standalone; Vercel and local builds keep the default output.
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  turbopack: {
    resolveAlias: { fs: nodeOnly, "fs/promises": nodeOnly },
  },
  webpack(config, { isServer }) {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "fs$": false,
        "fs/promises$": false,
        "url$": false,
        "path$": false,
      };
    }
    return config;
  },
};

export default nextConfig;
