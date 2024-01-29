import { CosmosClient, Database } from "@azure/cosmos";
import {
  ServiceLifecycle,
  ServicePublication,
  stores
} from "@io-services-cms/models";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as t from "io-ts";
import { HealthChecksError } from "./errors";

const Config = t.type({
  COSMOSDB_NAME: NonEmptyString,
  COSMOSDB_URI: NonEmptyString,
  COSMOSDB_KEY: NonEmptyString,
  COSMOSDB_CONTAINER_SERVICES_LIFECYCLE: NonEmptyString,
  COSMOSDB_CONTAINER_SERVICES_PUBLICATION: NonEmptyString
});
type Config = t.TypeOf<typeof Config>;

let cosmosConfig: Config;
let cosmosDatabase: Database;
let serviceLifecycleCosmosStore: ReturnType<typeof buildServiceLifecycleCosmosStore>;
let servicePublicationCosmosStore: ReturnType<typeof buildServicePublicationCosmosStore>;

const getCosmosConfig = (): Config => {
  if (!cosmosConfig) {
    const result = Config.decode(process.env);

    if (E.isLeft(result)) {
      throw new Error("error parsing cosmos config", {
        cause: readableReport(result.left)
      });
    }
    cosmosConfig = result.right;
  }

  return cosmosConfig;
};

const buildCosmosDatabase = (): Database => {
  const cosmosConfiguration = getCosmosConfig();
  const cosmosdbClient = new CosmosClient({
    endpoint: cosmosConfiguration.COSMOSDB_URI,
    key: cosmosConfiguration.COSMOSDB_KEY
  });
  return cosmosdbClient.database(cosmosConfiguration.COSMOSDB_NAME);
};

const getCosmosDatabase = (): Database => {
  if (!cosmosDatabase) {
    cosmosDatabase = buildCosmosDatabase();
  }
  return cosmosDatabase;
};

const buildServiceLifecycleCosmosStore = () => {
  const cosmosConfiguration = getCosmosConfig();
  const cosmos = getCosmosDatabase();
  return stores.createCosmosStore(
    cosmos.container(cosmosConfiguration.COSMOSDB_CONTAINER_SERVICES_LIFECYCLE),
    ServiceLifecycle.ItemType
  );
};

export const getServiceLifecycleCosmosStore = () => {
  if (!serviceLifecycleCosmosStore) {
    serviceLifecycleCosmosStore = buildServiceLifecycleCosmosStore();
  }
  return serviceLifecycleCosmosStore;
};

const buildServicePublicationCosmosStore = () => {
  const cosmosConfiguration = getCosmosConfig();
  const cosmos = getCosmosDatabase();
  return stores.createCosmosStore(
    cosmos.container(
      cosmosConfiguration.COSMOSDB_CONTAINER_SERVICES_PUBLICATION
    ),
    ServicePublication.ItemType
  );
};

export const getServicePublicationCosmosStore = () => {
  if (!servicePublicationCosmosStore) {
    servicePublicationCosmosStore = buildServicePublicationCosmosStore();
  }
  return servicePublicationCosmosStore;
};

export async function getCosmosStoreHealth() {
  try {
    const cosmos = getCosmosDatabase();
    const { resource } = await cosmos.client.getDatabaseAccount();
    if (!resource) {
      throw new Error();
    }
  } catch (e) {
    throw new HealthChecksError("cosmos-store", e);
  }
}
