import { CosmosClient } from "@azure/cosmos";
import { EventHubProducerClient } from "@azure/event-hubs";
import { DefaultAzureCredential } from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";
import { QueueServiceClient } from "@azure/storage-queue";
import * as healthcheck from "@pagopa/io-functions-commons/dist/src/utils/healthcheck";
import {
  ResponseErrorInternal,
  ResponseSuccessJson,
} from "@pagopa/ts-commons/lib/responses";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import { IConfig, envConfig } from "../../config";
import { healthcheck as checkPostgresDbHealth } from "../../lib/clients/pg-client";

// TODO: read these values from package json
const packageJson = { name: "io-services-cms-webapp", version: "0.0.0" };

const requireManagedIdentitySetting = (
  value: string | undefined,
  name: string,
): string => {
  if (!value) {
    throw new Error(`Missing managed identity setting: ${name}`);
  }
  return value;
};

const checkManagedIdentityHealth = (
  config: IConfig,
): healthcheck.HealthCheck<"AzureManagedIdentity"> =>
  TE.tryCatch(async () => {
    const credential = new DefaultAzureCredential();
    const queueServiceClient = new QueueServiceClient(
      requireManagedIdentitySetting(
        config.CMS_INTERNAL_STORAGE__queueServiceUri,
        "CMS_INTERNAL_STORAGE__queueServiceUri",
      ),
      credential,
    );
    await queueServiceClient.getProperties();

    const blobServiceClient = new BlobServiceClient(
      requireManagedIdentitySetting(
        config.CMS_INTERNAL_STORAGE__blobServiceUri,
        "CMS_INTERNAL_STORAGE__blobServiceUri",
      ),
      credential,
    );
    await blobServiceClient.getProperties();

    const cosmosClient = new CosmosClient({
      aadCredentials: credential,
      endpoint: requireManagedIdentitySetting(
        config.CMS_COSMOSDB__accountEndpoint,
        "CMS_COSMOSDB__accountEndpoint",
      ),
    });
    await cosmosClient.getDatabaseAccount();

    const legacyCosmosClient = new CosmosClient({
      aadCredentials: credential,
      endpoint: requireManagedIdentitySetting(
        config.CMS_LEGACY_COSMOSDB__accountEndpoint,
        "CMS_LEGACY_COSMOSDB__accountEndpoint",
      ),
    });
    await legacyCosmosClient.getDatabaseAccount();

    const eventHubProducerClient = new EventHubProducerClient(
      requireManagedIdentitySetting(
        config.SERVICES_EVENT_HUB_FULLY_QUALIFIED_NAMESPACE,
        "SERVICES_EVENT_HUB_FULLY_QUALIFIED_NAMESPACE",
      ),
      config.SERVICES_PUBLICATION_EVENT_HUB_NAME,
      credential,
    );
    try {
      await eventHubProducerClient.getEventHubProperties();
    } finally {
      await eventHubProducerClient.close();
    }

    return true as const;
  }, healthcheck.toHealthProblems("AzureManagedIdentity"));

export const makeInfoHandler = () =>
  pipe(
    envConfig,
    healthcheck.checkApplicationHealth(IConfig, [
      (c) =>
        c.USE_MANAGED_IDENTITY
          ? checkManagedIdentityHealth(c)
          : healthcheck.checkAzureStorageHealth(
              c.INTERNAL_STORAGE_CONNECTION_STRING,
            ),
      (c) =>
        c.USE_MANAGED_IDENTITY
          ? TE.right(true as const)
          : healthcheck.checkAzureCosmosDbHealth(
              c.COSMOSDB_URI,
              c.COSMOSDB_KEY,
            ),
      (c) => checkPostgresDbHealth(c),
    ]),
    TE.mapLeft((problems) => ResponseErrorInternal(problems.join("\n\n"))),
    TE.map((_) =>
      ResponseSuccessJson({
        name: packageJson.name,
        version: packageJson.version,
      }),
    ),
    TE.toUnion,
  );
