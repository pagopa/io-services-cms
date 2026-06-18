import type { FastifyInstance } from "fastify";

import { RouteRegistry } from "@pagopa/io-core-openapi";
import fastify from "fastify";

import { mountInfoHandler } from "./adapters/inbound/fastify/index.js";
import { getInfoUseCase } from "./application/use-cases/info.use-case.js";

export const createApp = (): {
  registry: RouteRegistry;
  server: FastifyInstance;
} => {
  const server = fastify();
  const registry = new RouteRegistry();

  // --- Dependency wiring ---

  // --- HTTP function registrations ---

  mountInfoHandler(server, getInfoUseCase, registry);

  return { registry, server };
};
