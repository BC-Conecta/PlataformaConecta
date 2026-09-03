import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  build: {
    // Minificação desativada a pedido: o bundle de produção é gerado
    // legível (sem minify/terser), facilitando depuração e auditoria.
    // Isso deixa os arquivos finais maiores — reative se preferir
    // otimizar o tamanho do bundle (`minify: "esbuild"`).
    minify: false,
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    globals: true,
  },
});
