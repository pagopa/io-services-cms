/**
 * Use a singleton CosmosDB client across functions.
 */
import { CosmosClient } from "@azure/cosmos";

import { LegacyCosmosConfiguration, getConfigOrThrow } from "../config";
import {
  createFallbackCosmosClient,
  createManagedIdentityCosmosClient,
} from "../lib/azure/cosmos";

const config = getConfigOrThrow();

// Setup DocumentDB
export const cosmosDbUri = config.LEGACY_COSMOSDB_URI;
export const cosmosDbName = config.LEGACY_COSMOSDB_NAME;
export const cosmosDbKey = config.LEGACY_COSMOSDB_KEY;

const createLegacyCosmosClient = (
  runtimeConfig: LegacyCosmosConfiguration,
): CosmosClient =>
  runtimeConfig.USE_MANAGED_IDENTITY
    ? createManagedIdentityCosmosClient(
        runtimeConfig.CMS_LEGACY_COSMOSDB__accountEndpoint,
      )
    : createFallbackCosmosClient({
        endpoint: runtimeConfig.LEGACY_COSMOSDB_URI,
        key: runtimeConfig.LEGACY_COSMOSDB_KEY,
      });

export const cosmosdbClient: CosmosClient = createLegacyCosmosClient(config);

export const cosmosdbInstance = cosmosdbClient.database(cosmosDbName);
