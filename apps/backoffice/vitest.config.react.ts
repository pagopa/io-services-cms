/// <reference types="vitest" />
/// <reference types="vite/client" />

import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    include: ["./src/**/__tests__/*.tsx"],
    exclude: ["./src/components/__tests__/setup.ts"],
    css: true,
    setupFiles: "./src/components/__tests__/setup.ts"
  }
});
