import { CosmosClient } from "@azure/cosmos";
import {
  SUBSCRIPTION_CIDRS_COLLECTION_NAME,
  SubscriptionCIDRsModel
} from "@pagopa/io-functions-commons/dist/src/models/subscription_cidrs";
import { BooleanFromString } from "@pagopa/ts-commons/lib/booleans";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as t from "io-ts";
import { cache } from "react";
import { HealthChecksError } from "./errors";

const Config = t.type({
  LEGACY_COSMOSDB_NAME: NonEmptyString,
  LEGACY_COSMOSDB_URI: NonEmptyString,
  LEGACY_COSMOSDB_KEY: NonEmptyString,
  LEGACY_COSMOSDB_MOCKING: BooleanFromString
});

const getLegacyCosmosConfig = cache(() => {
  const result = Config.decode(process.env);

  if (E.isLeft(result)) {
    throw new Error("error parsing legacy cosmos config", {
      cause: readableReport(result.left)
    });
  }
  return result.right;
});

const getLegacyCosmosClient = cache(() => {
  const { LEGACY_COSMOSDB_URI, LEGACY_COSMOSDB_KEY } = getLegacyCosmosConfig();
  return new CosmosClient({
    endpoint: LEGACY_COSMOSDB_URI,
    key: LEGACY_COSMOSDB_KEY
  });
});

export const getLegacyCosmosContainerClient = (cosmosContainerName: string) => {
  const { LEGACY_COSMOSDB_NAME } = getLegacyCosmosConfig();
  return getLegacyCosmosClient()
    .database(LEGACY_COSMOSDB_NAME)
    .container(cosmosContainerName);
};

export const getSubscriptionCIDRsModel = () =>
  new SubscriptionCIDRsModel(
    getLegacyCosmosContainerClient(SUBSCRIPTION_CIDRS_COLLECTION_NAME)
  );

export async function getLegacyCosmosHealth() {
  try {
    const cosmos = getLegacyCosmosClient();
    const { resource } = await cosmos.getDatabaseAccount();
    if (!resource) {
      throw new Error();
    }
  } catch (e) {
    throw new HealthChecksError("legacy-cosmos-db", e);
  }
}
