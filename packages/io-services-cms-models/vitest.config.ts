import { defaultExclude, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: [...defaultExclude, "__integrations__"],
    typecheck: {
      ignoreSourceErrors: true,
    },
    coverage: {
      reporter: ["text", "json-summary", "json"],
    },
  },
});
