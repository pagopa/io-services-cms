import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    typecheck: {
      ignoreSourceErrors: true,
    },
    coverage: {
      reporter: ["text", "json-summary", "json"],
      ignoreEmptyLines: true,
    },
  },
});
