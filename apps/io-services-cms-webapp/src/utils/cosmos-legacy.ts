/**
 * Use a singleton CosmosDB client across functions.
 */
import { CosmosClient } from "@azure/cosmos";
import { DefaultAzureCredential } from "@azure/identity";

import { getConfigOrThrow } from "../config";

const config = getConfigOrThrow();

const requireManagedIdentityEndpoint = (
  endpoint: string | undefined,
  name: string,
): string => {
  if (!endpoint) {
    throw new Error(`Missing managed identity setting: ${name}`);
  }

  return endpoint;
};

// Setup DocumentDB
export const cosmosDbUri = config.LEGACY_COSMOSDB_URI;
export const cosmosDbName = config.LEGACY_COSMOSDB_NAME;
export const cosmosDbKey = config.LEGACY_COSMOSDB_KEY;

export const cosmosdbClient = config.USE_MANAGED_IDENTITY
  ? new CosmosClient({
      aadCredentials: new DefaultAzureCredential(),
      endpoint: requireManagedIdentityEndpoint(
        config.CMS_LEGACY_COSMOSDB__accountEndpoint,
        "CMS_LEGACY_COSMOSDB__accountEndpoint",
      ),
    })
  : new CosmosClient({
      endpoint: cosmosDbUri,
      key: cosmosDbKey,
    });

export const cosmosdbInstance = cosmosdbClient.database(cosmosDbName);
