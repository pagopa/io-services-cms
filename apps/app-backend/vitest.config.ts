import { configDefaults, defineConfig, mergeConfig } from "vitest/config";
import configShared from "../../vitest.shared.js";

export default mergeConfig(
  configShared,
  defineConfig({
    test: {
      coverage: {
        exclude: [
          ...configDefaults.exclude,
          "src/generated/**",
          "src/main.ts",
          "src/config.ts",
          ".eslintrc.js",
          "**/__mocks__/**",
        ],
      },
    },
  })
);
