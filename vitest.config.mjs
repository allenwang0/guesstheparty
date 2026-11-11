import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react({ include: /\.[jt]sx?$/ })],
  esbuild: { loader: "jsx", include: /\.[jt]sx?$/, exclude: [] },
  test: {
    environment: "node",
    setupFiles: ["test/setup-dom.js"],
    include: ["**/*.test.{js,mjs}"],
    exclude: ["node_modules/**", "e2e/**", ".next/**"],
  },
});
