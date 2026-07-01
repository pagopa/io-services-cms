import type { FastifyInstance } from "fastify";

import fastify from "fastify";

import { mountInfoHandler } from "./adapters/inbound/fastify/info.handler.js";
import { PackageJsonAppInfoReader } from "./adapters/outbound/package-json/package-json-app-info-reader.js";
import { makeGetInfoUseCase } from "./application/use-cases/info.use-case.js";

export const createApp = (): {
  server: FastifyInstance;
} => {
  const server = fastify({
    logger: true,
  });

  const appInfoReader = new PackageJsonAppInfoReader();

  mountInfoHandler(server, makeGetInfoUseCase(appInfoReader));

  return { server };
};
