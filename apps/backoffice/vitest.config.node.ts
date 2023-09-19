import { defineConfig } from "vitest/config";
import * as path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  test: {
    setupFiles: ["./mocks/msw-vitest.ts"],
    include: ["./src/**/__tests__/*.ts"]
  }
});
