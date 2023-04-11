import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    typecheck: { include: ["**/*.test-d.ts"], ignoreSourceErrors: true },
  },
});
