import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  build: {
    // Evita limpeza completa de dist a cada build local (mais rápido com muitos assets estáticos)
    emptyOutDir: false,
  },
  server: {
    fs: {
      allow: [path.resolve(__dirname), path.resolve(__dirname, "..")],
    },
  },
});
