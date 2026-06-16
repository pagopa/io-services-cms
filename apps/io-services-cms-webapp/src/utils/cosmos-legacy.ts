/**
 * Use a singleton CosmosDB client across functions.
 */
import { CosmosClient } from "@azure/cosmos";
import { DefaultAzureCredential } from "@azure/identity";

import { getConfigOrThrow } from "../config";

const config = getConfigOrThrow();

// Setup DocumentDB
export const cosmosDbUri = config.LEGACY_COSMOSDB_URI;
export const cosmosDbName = config.LEGACY_COSMOSDB_NAME;
export const cosmosDbKey = config.LEGACY_COSMOSDB_KEY;

export const cosmosdbClient = config.USE_MANAGED_IDENTITY
  ? new CosmosClient({
      aadCredentials: new DefaultAzureCredential(),
      endpoint: config.CMS_LEGACY_COSMOSDB__accountEndpoint ?? cosmosDbUri,
    })
  : new CosmosClient({
      endpoint: cosmosDbUri,
      key: cosmosDbKey,
    });

export const cosmosdbInstance = cosmosdbClient.database(cosmosDbName);
