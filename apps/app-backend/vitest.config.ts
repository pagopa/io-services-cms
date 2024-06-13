import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    typecheck: {
      ignoreSourceErrors: true,
    },
    coverage: {
      reporter: ["text", "json-summary", "json"],
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
});
