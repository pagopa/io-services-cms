import type { GenericError, UseCase } from "@pagopa/hexagonal-core";
import type { FastifyInstance } from "fastify";

import { ProblemDetailsSchema, defineRoute } from "@pagopa/hexagonal-core";
import { mountFastifyRoute } from "@pagopa/hexagonal-fastify";

import { AppInfo } from "../../../application/ports/app-info.js";
import { InfoOutputSchema } from "./dto/info.dto.js";

const infoContract = defineRoute({
  method: "get",
  operationId: "getInfo",
  path: "/api/info",
  request: {},
  response: {
    200: InfoOutputSchema,
    500: ProblemDetailsSchema,
  },
});

export const mountInfoHandler = (
  server: FastifyInstance,
  useCase: UseCase<Record<string, never>, AppInfo, GenericError>,
): void => {
  mountFastifyRoute(server, {
    contract: infoContract,
    inputMapper: () => ({}),
    useCase,
  });
};
