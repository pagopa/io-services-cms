import { defaultExclude, defineConfig, mergeConfig } from "vitest/config";
import configShared from "../../vitest.shared.js";

export default mergeConfig(
  configShared,
  defineConfig({
    test: {
      exclude: [...defaultExclude, "__integrations__"],
    },
  })
);
