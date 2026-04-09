import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import fs from "fs";

// Rewrite Lightning CSS range syntax (width>=Npx) → standard min-width.
// Must run AFTER tailwindcss() (default order), not pre.
function fixMediaQueriesPlugin() {
  return {
    name: "fix-media-queries",
    transform(code: string, id: string) {
      if (!id.endsWith(".css")) return;
      if (!code.includes("width>=")) return null;
      const fixed = code
        .replace(/\(width>=(\d+(?:\.\d+)?)px\)/g, "(min-width:$1px)")
        .replace(/\(width>=(\d+(?:\.\d+)?)rem\)/g, "(min-width:$1rem)");
      return { code: fixed, map: null };
    },
  };
}

export default defineConfig({
  cacheDir: "/tmp/.vite",
  plugins: [react(), tailwindcss(), fixMediaQueriesPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // NOTE: Do NOT use css.transformer: "lightningcss" here —
  // it conflicts with @tailwindcss/vite v4 which handles CSS internally.
  server: {
    headers: {
      "Cache-Control": "no-store",
    },
  },
});
