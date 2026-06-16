import { CosmosClient, Database } from "@azure/cosmos";
import { DefaultAzureCredential } from "@azure/identity";

import { CosmosConfig, ManagedIdentityConfiguration } from "../../config";
import {
  requireFallbackSetting,
  requireManagedIdentitySetting,
} from "./managed-identity";

export const createManagedIdentityCosmosClient = (
  endpoint: string | undefined,
  name: string,
  aadCredentials: DefaultAzureCredential = new DefaultAzureCredential(),
): CosmosClient =>
  new CosmosClient({
    aadCredentials,
    endpoint: requireManagedIdentitySetting(endpoint, name),
  });

export const createFallbackCosmosClient = ({ endpoint, key }: {
  endpoint: string;
  key: string;
}): CosmosClient =>
  new CosmosClient({
    endpoint,
    key,
  });

const getManagedIdentityCosmosDatabase = ({
  databaseName,
  endpoint,
  endpointName,
}: {
  databaseName: string;
  endpoint: string | undefined;
  endpointName: string;
}): Database =>
  createManagedIdentityCosmosClient(endpoint, endpointName).database(
    databaseName,
  );

const getFallbackCosmosDatabase = ({
  databaseName,
  endpoint,
  key,
}: {
  databaseName: string;
  endpoint: string;
  key: string;
}): Database => createFallbackCosmosClient({ endpoint, key }).database(databaseName);

export const getCmsCosmosDatabase = ({
  CMS_COSMOSDB__accountEndpoint,
  COSMOSDB_KEY,
  COSMOSDB_NAME,
  COSMOSDB_URI,
  USE_MANAGED_IDENTITY,
}: CosmosConfig & ManagedIdentityConfiguration): Database =>
  USE_MANAGED_IDENTITY
    ? getManagedIdentityCosmosDatabase({
        databaseName: COSMOSDB_NAME,
        endpoint: CMS_COSMOSDB__accountEndpoint,
        endpointName: "CMS_COSMOSDB__accountEndpoint",
      })
    : getFallbackCosmosDatabase({
        databaseName: COSMOSDB_NAME,
        endpoint: COSMOSDB_URI,
        key: requireFallbackSetting(COSMOSDB_KEY, "COSMOSDB_KEY"),
      });

export const getAppBackendCosmosDatabase = ({
  CMS_COSMOSDB__accountEndpoint,
  COSMOSDB_APP_BE_NAME,
  COSMOSDB_KEY,
  COSMOSDB_URI,
  USE_MANAGED_IDENTITY,
}: CosmosConfig & ManagedIdentityConfiguration): Database =>
  USE_MANAGED_IDENTITY
    ? getManagedIdentityCosmosDatabase({
        databaseName: COSMOSDB_APP_BE_NAME,
        endpoint: CMS_COSMOSDB__accountEndpoint,
        endpointName: "CMS_COSMOSDB__accountEndpoint",
      })
    : getFallbackCosmosDatabase({
        databaseName: COSMOSDB_APP_BE_NAME,
        endpoint: COSMOSDB_URI,
        key: requireFallbackSetting(COSMOSDB_KEY, "COSMOSDB_KEY"),
      });
