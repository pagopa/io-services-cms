import { CosmosClient } from "@azure/cosmos";
import {
  ServiceLifecycle,
  ServicePublication,
  stores
} from "@io-services-cms/models";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as t from "io-ts";
import { cache } from "react";
import { HealthChecksError } from "./errors";

const Config = t.type({
  COSMOSDB_NAME: NonEmptyString,
  COSMOSDB_URI: NonEmptyString,
  COSMOSDB_KEY: NonEmptyString,
  COSMOSDB_CONTAINER_SERVICES_LIFECYCLE: NonEmptyString,
  COSMOSDB_CONTAINER_SERVICES_PUBLICATION: NonEmptyString
});

const getCosmosConfig = cache(() => {
  const result = Config.decode(process.env);

  if (E.isLeft(result)) {
    throw new Error("error parsing cosmos config", {
      cause: readableReport(result.left)
    });
  }
  return result.right;
});

const getCosmosDatabase = cache(() => {
  const cosmosConfiguration = getCosmosConfig();
  const cosmosdbClient = new CosmosClient({
    endpoint: cosmosConfiguration.COSMOSDB_URI,
    key: cosmosConfiguration.COSMOSDB_KEY
  });
  return cosmosdbClient.database(cosmosConfiguration.COSMOSDB_NAME);
});

export const getServiceLifecycleCosmosStore = cache(() => {
  const cosmosConfiguration = getCosmosConfig();
  const cosmos = getCosmosDatabase();
  stores.createCosmosStore(
    cosmos.container(cosmosConfiguration.COSMOSDB_CONTAINER_SERVICES_LIFECYCLE),
    ServiceLifecycle.ItemType
  );
});

export const getServicePublicationCosmosStore = cache(() => {
  const cosmosConfiguration = getCosmosConfig();
  const cosmos = getCosmosDatabase();
  stores.createCosmosStore(
    cosmos.container(
      cosmosConfiguration.COSMOSDB_CONTAINER_SERVICES_PUBLICATION
    ),
    ServicePublication.ItemType
  );
});

export async function getLegacyCosmosHealth() {
  try {
    const cosmos = getCosmosDatabase();
    const { resource } = await cosmos.client.getDatabaseAccount();
    if (!resource) {
      throw new Error();
    }
  } catch (e) {
    throw new HealthChecksError("cosmos-db", e);
  }
}
