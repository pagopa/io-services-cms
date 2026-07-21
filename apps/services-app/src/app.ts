import type { FastifyInstance } from "fastify";

import fastify from "fastify";
import { Pool } from "pg";

import { AppConfig } from "./adapters/inbound/config/config.js";
import { mountGetServiceInternalHandler } from "./adapters/inbound/fastify/get-service-internal.handler.js";
import { mountInfoHandler } from "./adapters/inbound/fastify/info.handler.js";
import {
  createConnectionStringCosmosClient,
  createManagedIdentityCosmosClient,
} from "./adapters/outbound/cosmos/cosmos-client.js";
import { CosmosServiceLifecycleRepository } from "./adapters/outbound/cosmos/cosmos-service-lifecycle-repository.js";
import { CosmosServicePublicationRepository } from "./adapters/outbound/cosmos/cosmos-service-publication-repository.js";
import { PackageJsonAppInfoReader } from "./adapters/outbound/package-json/package-json-app-info-reader.js";
import { PostgresTopicRepository } from "./adapters/outbound/postgres/postgres-topic-repository.js";
import { makeGetServiceInternalUseCase } from "./application/use-cases/get-service-internal.use-case.js";
import { makeGetInfoUseCase } from "./application/use-cases/info.use-case.js";

const createCmsCosmosClient = (config: AppConfig) =>
  config.NODE_ENV === "production"
    ? createManagedIdentityCosmosClient(config.CMS_COSMOSDB_ENDPOINT)
    : createConnectionStringCosmosClient(config.CMS_COSMOSDB_CONNECTION_STRING);

const createTopicPool = (config: AppConfig) =>
  new Pool({
    application_name: config.npm_package_name,
    database: config.POSTGRES_DATABASE,
    host: config.POSTGRES_HOST,
    password: config.POSTGRES_PASSWORD,
    port: config.POSTGRES_PORT,
    ssl: config.POSTGRES_SSL_ENABLED,
    user: config.POSTGRES_USER,
  });

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

  // CosmosDb initialization
  const cosmosClient = createCmsCosmosClient(config);
  const database = cosmosClient.database(config.CMS_COSMOSDB_NAME);
  const lifecycleRepository = new CosmosServiceLifecycleRepository(
    database.container(config.CMS_COSMOSDB_CONTAINER_SERVICES_LIFECYCLE),
  );
  const publicationRepository = new CosmosServicePublicationRepository(
    database.container(config.CMS_COSMOSDB_CONTAINER_SERVICES_PUBLICATION),
  );

  // Postgres initialization
  const topicPool = createTopicPool(config);
  const topicRepository = new PostgresTopicRepository(
    topicPool,
    config.TOPIC_SCHEMA,
    config.TOPIC_TABLE,
  );

  server.addHook("onClose", async () => topicPool.end());

  mountInfoHandler(server, makeGetInfoUseCase(appInfoReader));
  mountGetServiceInternalHandler(
    server,
    makeGetServiceInternalUseCase(
      publicationRepository,
      lifecycleRepository,
      topicRepository,
    ),
  );

  return { server };
};
