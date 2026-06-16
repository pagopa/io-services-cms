/**
 * Use a singleton CosmosDB client across functions.
 */
import { CosmosClient } from "@azure/cosmos";

import { getConfigOrThrow } from "../config";
import {
  createFallbackCosmosClient,
  createManagedIdentityCosmosClient,
} from "../lib/azure/cosmos";
import { requireFallbackSetting } from "../lib/azure/managed-identity";

const config = getConfigOrThrow();

// Setup DocumentDB
export const cosmosDbUri = config.LEGACY_COSMOSDB_URI;
export const cosmosDbName = config.LEGACY_COSMOSDB_NAME;
export const cosmosDbKey = config.LEGACY_COSMOSDB_KEY;

export const cosmosdbClient: CosmosClient = config.USE_MANAGED_IDENTITY
  ? createManagedIdentityCosmosClient(
      config.CMS_LEGACY_COSMOSDB__accountEndpoint,
      "CMS_LEGACY_COSMOSDB__accountEndpoint",
    )
  : createFallbackCosmosClient({
      endpoint: cosmosDbUri,
      key: requireFallbackSetting(cosmosDbKey, "LEGACY_COSMOSDB_KEY"),
    });

export const cosmosdbInstance = cosmosdbClient.database(cosmosDbName);
