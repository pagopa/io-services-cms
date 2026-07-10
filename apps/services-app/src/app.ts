import type { FastifyInstance } from "fastify";

import fastify from "fastify";

import { AppConfig } from "./adapters/inbound/config/config.js";
import { mountInfoHandler } from "./adapters/inbound/fastify/info.handler.js";
import { PackageJsonAppInfoReader } from "./adapters/outbound/package-json/package-json-app-info-reader.js";
import { makeGetInfoUseCase } from "./application/use-cases/info.use-case.js";

export const createApp = (
  config: AppConfig,
): {
  server: FastifyInstance;
} => {
  const server = fastify({
    // We only enable access logs during local development.
    logger: config.NODE_ENV === "development",
  });

  const appInfoReader = new PackageJsonAppInfoReader(
    config.npm_package_name,
    config.npm_package_version,
  );

  mountInfoHandler(server, makeGetInfoUseCase(appInfoReader));

  return { server };
};
