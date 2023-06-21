/**
 * Use a singleton CosmosDB client across functions.
 */
import { CosmosClient } from "@azure/cosmos";

import { getConfigOrThrow } from "../config";

const config = getConfigOrThrow();

// Setup DocumentDB
export const cosmosDbUri = config.COSMOSDB_LEGACY_URI;
export const cosmosDbName = config.COSMOSDB_LEGACY_NAME;
export const cosmosDbKey = config.COSMOSDB_LEGACY_KEY;

export const cosmosdbClient = new CosmosClient({
  endpoint: cosmosDbUri,
  key: cosmosDbKey,
});

export const cosmosdbInstance = cosmosdbClient.database(cosmosDbName);
