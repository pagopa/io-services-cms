/// <reference types="vitest" />
/// <reference types="vite/client" />

import react from "@vitejs/plugin-react";
import * as path from "node:path";
import { configDefaults, defineConfig, mergeConfig } from "vitest/config";
import configShared from "../../vitest.shared.js";

export default mergeConfig(
  configShared,
  defineConfig({
    plugins: [react() as any],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src")
      }
    },
    test: {
      globals: true,
      environment: "jsdom",
      include: ["./src/**/*.test.tsx"],
      exclude: [
        ...configDefaults.exclude,
        "./src/components/__tests__/setup.ts"
      ],
      css: true,
      setupFiles: "./src/components/__tests__/setup.ts",
      coverage: {
        reporter: ["text", "json-summary", "json"],
        reportsDirectory: `${configDefaults.coverage.reportsDirectory}/frontend`,
        exclude: [
          ...(configDefaults.coverage.exclude
            ? configDefaults.coverage.exclude
            : []),
          ".next/*",
          "mocks/*",
          "public/*",
          "*.config.js",
          "src/generated/**",
          "src/config/*",
          "src/types/*",
          "src/main.ts",
          "src/config.ts",
          "src/instrumentation.ts",
          "**/__mocks__/**",
          // BE
          "src/app/*",
          "src/lib/be/*"
        ]
      }
    }
  })
);
