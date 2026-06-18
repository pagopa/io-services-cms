import {
  buildOpenApiDocument,
  writeOpenApiYaml,
} from "@pagopa/io-core-openapi";
/**
 * Static generator for the io-services-app OpenAPI specification.
 * Bootstraps the app to populate the route registry (the single source
 * of truth shared with the running server) and writes the resulting
 * document to `openapi/openapi-code-first.yaml`.
 *
 * Pass `--check` to fail when the generated spec differs from what is
 * already on disk (used in CI to detect drift between code and spec).
 *
 * Usage: tsx scripts/generate-openapi.ts [--check]
 */
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createApp } from "../src/createApp.js";

const { registry } = createApp();

const HERE = fileURLToPath(new URL(".", import.meta.url));
const OUTPUT_PATH = resolve(HERE, "..", "openapi", "openapi-code-first.yaml");

const document = buildOpenApiDocument({
  document: {
    info: {
      description:
        "Example Fastify app following the hexagonal architecture pattern.",
      license: { identifier: "MIT", name: "MIT" },
      title: "io-services-app",
      version: "0.0.1",
    },
    security: [],
    servers: [
      {
        description: "Local development server",
        url: "http://localhost:7071",
      },
    ],
  },
  namedSchemas: registry.getSchemas(),
  registerComponents: (registry) => {
    registry.registerComponent("securitySchemes", "functionKey", {
      description:
        "Azure Functions host key passed as the `x-functions-key` header.",
      in: "header",
      name: "x-functions-key",
      type: "apiKey",
    });
  },
  routes: registry.getAll(),
});

const isCheck = process.argv.includes("--check");

const result = await writeOpenApiYaml({
  check: isCheck,
  doc: document,
  path: OUTPUT_PATH,
});

if (result.kind === "check-failed") {
  console.error(
    "[generate-openapi] " +
      result.path +
      " is out of date. Run `pnpm generate:openapi` and commit the result.",
  );
  console.error(result.diff);
  process.exit(1);
}

if (result.kind === "ok") {
  console.log("[generate-openapi] wrote " + result.path);
} else {
  console.log("[generate-openapi] " + result.path + " is up to date");
}
