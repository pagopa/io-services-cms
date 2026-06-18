import type { UseCase } from "@pagopa/io-core-domain";
import type { RouteRegistry } from "@pagopa/io-core-openapi";
import type { FastifyInstance } from "fastify";

import { mountFastifyRoute } from "@pagopa/io-core-adapter-fastify";
import { defineRoute } from "@pagopa/io-core-openapi";

import { InfoOutputSchema } from "./dto/openapi-schemas.js";

const infoContract = defineRoute({
  description: "Returns the application name, version, and health status.",
  method: "get",
  operationId: "getInfo",
  path: "/api/info",
  request: {},
  response: {
    200: {
      description: "Application info returned successfully.",
      schema: InfoOutputSchema,
    },
  },
  summary: "Health check / application info",
  tags: ["Info"],
});

/**
 * Mounts the `getInfo` route. The contract declares no errors, so the use
 * case error union must be `never` (the use case cannot fail).
 */
export const mountInfoHandler = (
  server: FastifyInstance,
  useCase: UseCase<
    Record<string, never>,
    { name: string; ok: boolean; version: string },
    never
  >,
  registry?: RouteRegistry,
): void => {
  mountFastifyRoute(server, {
    contract: infoContract,
    registry,
    transformInput: () => ({}),
    useCase,
  });
};
