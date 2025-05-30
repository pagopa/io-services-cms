import * as path from "node:path";
import { configDefaults, defineConfig, mergeConfig } from "vitest/config";
import configShared from "../../vitest.shared.js";

export default mergeConfig(
  configShared,
  defineConfig({
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    test: {
      setupFiles: ["./mocks/msw-vitest.ts"],
      include: ["./src/**/__tests__/*.ts"],
      exclude: [
        ...configDefaults.exclude,
        "./src/components/__tests__/setup.ts",
      ],
      coverage: {
        reportsDirectory: `${configDefaults.coverage.reportsDirectory}/backend`,
        extension: configDefaults.coverage.extension
          ?.toString()
          .replace(",.tsx", "")
          .split(","),
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
          // FE
          "src/hooks/*",
          "src/layouts/*",
        ],
      },
    },
  }),
);
