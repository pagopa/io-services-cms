import type { GenericError, UseCase } from "@pagopa/hexagonal-core";
import type { FastifyInstance } from "fastify";

import { ProblemDetailsSchema, defineRoute } from "@pagopa/hexagonal-core";
import { mountFastifyRoute } from "@pagopa/hexagonal-fastify";

import type { AppHealthcheck } from "../../../application/ports/app-healthcheck.js";

import { HealthcheckOutputSchema } from "./dto/healthcheck.dto.js";

const healthcheckContract = defineRoute({
  method: "get",
  path: "/api/health",
  request: {},
  response: {
    200: HealthcheckOutputSchema,
    500: ProblemDetailsSchema,
  },
});

export const mountHealthcheckHandler = (
  server: FastifyInstance,
  useCase: UseCase<Record<string, never>, AppHealthcheck, GenericError>,
): void => {
  mountFastifyRoute(server, {
    contract: healthcheckContract,
    inputMapper: () => ({}),
    useCase,
  });
};
