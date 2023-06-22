/**
 * Use a singleton CosmosDB client across functions.
 */
import { CosmosClient } from "@azure/cosmos";

import { getConfigOrThrow } from "../config";

const config = getConfigOrThrow();

// Setup DocumentDB
export const cosmosDbUri = config.LEGACY_COSMOSDB_URI;
export const cosmosDbName = config.LEGACY_COSMOSDB_NAME;
export const cosmosDbKey = config.LEGACY_COSMOSDB_KEY;

export const cosmosdbClient = new CosmosClient({
  endpoint: cosmosDbUri,
  key: cosmosDbKey,
});

export const cosmosdbInstance = cosmosdbClient.database(cosmosDbName);
