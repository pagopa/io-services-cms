/// <reference types="vitest" />
/// <reference types="vite/client" />

import { defineConfig } from "vitest/config";
import * as path from "node:path";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  test: {
    globals: true,
    environment: "jsdom",
    include: ["./src/**/__tests__/*.tsx"],
    exclude: ["./src/components/__tests__/setup.ts"],
    css: true,
    setupFiles: "./src/components/__tests__/setup.ts"
  }
});
