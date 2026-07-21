import type { FastifyInstance } from "fastify";

import { ProblemDetailsSchema, defineRoute } from "@pagopa/hexagonal-core";
import { mountFastifyRoute } from "@pagopa/hexagonal-fastify";

import type { GetServiceInternalUseCase } from "../../../application/use-cases/get-service-internal.use-case.js";

import {
  GetServiceInternalOutputSchema,
  GetServiceInternalPathSchema,
  toGetServiceInternalOutputDto,
} from "./dto/get-service-internal.dto.js";

const getServiceInternalContract = defineRoute({
  method: "get",
  operationId: "getServiceInternal",
  path: "/api/v1/internal/services/{serviceId}",
  request: {
    path: GetServiceInternalPathSchema,
  },
  response: {
    200: GetServiceInternalOutputSchema,
    400: ProblemDetailsSchema,
    404: ProblemDetailsSchema,
    500: ProblemDetailsSchema,
  },
});

export const mountGetServiceInternalHandler = (
  server: FastifyInstance,
  useCase: GetServiceInternalUseCase,
): void => {
  mountFastifyRoute(server, {
    contract: getServiceInternalContract,
    inputMapper: ({ path }) => ({ serviceId: path.serviceId }),
    outputMapper: toGetServiceInternalOutputDto,
    useCase,
  });
};
