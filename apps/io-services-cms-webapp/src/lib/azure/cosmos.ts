import { CosmosClient, Database } from "@azure/cosmos";
import { DefaultAzureCredential } from "@azure/identity";

import {
  CosmosConfig,
  RuntimeModeDisabledConfiguration,
  RuntimeModeEnabledConfiguration,
} from "../../config";

type ManagedIdentityCosmosConfiguration = Omit<
  CosmosConfig,
  "COSMOSDB_CONNECTIONSTRING" | "COSMOSDB_KEY"
> &
  RuntimeModeEnabledConfiguration;

type FallbackCosmosConfiguration = CosmosConfig &
  RuntimeModeDisabledConfiguration;

type CosmosDatabaseConfiguration =
  | FallbackCosmosConfiguration
  | ManagedIdentityCosmosConfiguration;

export const createManagedIdentityCosmosClient = (
  endpoint: string,
  aadCredentials: DefaultAzureCredential = new DefaultAzureCredential(),
): CosmosClient =>
  new CosmosClient({
    aadCredentials,
    endpoint,
  });

export const createFallbackCosmosClient = ({
  endpoint,
  key,
}: {
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
}: {
  databaseName: string;
  endpoint: string;
}): Database =>
  createManagedIdentityCosmosClient(endpoint).database(databaseName);

const getFallbackCosmosDatabase = ({
  databaseName,
  endpoint,
  key,
}: {
  databaseName: string;
  endpoint: string;
  key: string;
}): Database =>
  createFallbackCosmosClient({ endpoint, key }).database(databaseName);

export const getCmsCosmosDatabase = (
  config: CosmosDatabaseConfiguration,
): Database =>
  config.USE_MANAGED_IDENTITY
    ? getManagedIdentityCosmosDatabase({
        databaseName: config.COSMOSDB_NAME,
        endpoint: config.CMS_COSMOSDB__accountEndpoint,
      })
    : getFallbackCosmosDatabase({
        databaseName: config.COSMOSDB_NAME,
        endpoint: config.COSMOSDB_URI,
        key: config.COSMOSDB_KEY,
      });

export const getAppBackendCosmosDatabase = (
  config: CosmosDatabaseConfiguration,
): Database =>
  config.USE_MANAGED_IDENTITY
    ? getManagedIdentityCosmosDatabase({
        databaseName: config.COSMOSDB_APP_BE_NAME,
        endpoint: config.CMS_COSMOSDB__accountEndpoint,
      })
    : getFallbackCosmosDatabase({
        databaseName: config.COSMOSDB_APP_BE_NAME,
        endpoint: config.COSMOSDB_URI,
        key: config.COSMOSDB_KEY,
      });
