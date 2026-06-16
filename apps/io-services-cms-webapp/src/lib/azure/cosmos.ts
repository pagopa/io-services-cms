import { CosmosClient, Database } from "@azure/cosmos";
import { DefaultAzureCredential } from "@azure/identity";

import { CosmosConfig, ManagedIdentityConfiguration } from "../../config";

const requireManagedIdentityEndpoint = (
  endpoint: string | undefined,
  name: string,
): string => {
  if (!endpoint) {
    throw new Error(`Missing managed identity setting: ${name}`);
  }

  return endpoint;
};

export const getCmsCosmosDatabase = ({
  CMS_COSMOSDB__accountEndpoint,
  COSMOSDB_KEY,
  COSMOSDB_NAME,
  COSMOSDB_URI,
  USE_MANAGED_IDENTITY,
}: CosmosConfig & ManagedIdentityConfiguration): Database => {
  const cosmosdbClient = USE_MANAGED_IDENTITY
    ? new CosmosClient({
        aadCredentials: new DefaultAzureCredential(),
        endpoint: requireManagedIdentityEndpoint(
          CMS_COSMOSDB__accountEndpoint,
          "CMS_COSMOSDB__accountEndpoint",
        ),
      })
    : new CosmosClient({
        endpoint: COSMOSDB_URI,
        key: COSMOSDB_KEY,
      });
  return cosmosdbClient.database(COSMOSDB_NAME);
};

export const getAppBackendCosmosDatabase = ({
  CMS_COSMOSDB__accountEndpoint,
  COSMOSDB_APP_BE_NAME,
  COSMOSDB_KEY,
  COSMOSDB_URI,
  USE_MANAGED_IDENTITY,
}: CosmosConfig & ManagedIdentityConfiguration): Database => {
  const cosmosdbClient = USE_MANAGED_IDENTITY
    ? new CosmosClient({
        aadCredentials: new DefaultAzureCredential(),
        endpoint: requireManagedIdentityEndpoint(
          CMS_COSMOSDB__accountEndpoint,
          "CMS_COSMOSDB__accountEndpoint",
        ),
      })
    : new CosmosClient({
        endpoint: COSMOSDB_URI,
        key: COSMOSDB_KEY,
      });
  return cosmosdbClient.database(COSMOSDB_APP_BE_NAME);
};
