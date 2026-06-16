/**
 * Use a singleton CosmosDB client across functions.
 */
import { CosmosClient } from "@azure/cosmos";

import {
  CosmosLegacyConfig,
  getConfigOrThrow,
  RuntimeModeDisabledConfiguration,
  RuntimeModeEnabledConfiguration,
} from "../config";
import {
  createFallbackCosmosClient,
  createManagedIdentityCosmosClient,
} from "../lib/azure/cosmos";

type ManagedIdentityLegacyCosmosConfiguration = Omit<
  CosmosLegacyConfig,
  "LEGACY_COSMOSDB_CONNECTIONSTRING" | "LEGACY_COSMOSDB_KEY"
> &
  RuntimeModeEnabledConfiguration;

type FallbackLegacyCosmosConfiguration = CosmosLegacyConfig &
  RuntimeModeDisabledConfiguration;

type LegacyCosmosConfiguration =
  | ManagedIdentityLegacyCosmosConfiguration
  | FallbackLegacyCosmosConfiguration;

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
        "CMS_LEGACY_COSMOSDB__accountEndpoint",
      )
    : createFallbackCosmosClient({
        endpoint: runtimeConfig.LEGACY_COSMOSDB_URI,
        key: runtimeConfig.LEGACY_COSMOSDB_KEY,
      });

export const cosmosdbClient: CosmosClient = createLegacyCosmosClient(config);

export const cosmosdbInstance = cosmosdbClient.database(cosmosDbName);
