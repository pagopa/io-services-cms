import { CosmosClient } from "@azure/cosmos";
import {
  SUBSCRIPTION_CIDRS_COLLECTION_NAME,
  SubscriptionCIDRsModel,
} from "@pagopa/io-functions-commons/dist/src/models/subscription_cidrs";
import { BooleanFromString } from "@pagopa/ts-commons/lib/booleans";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as t from "io-ts";

import { HealthChecksError } from "./errors";

let legacyCosmosClient: CosmosClient;
let subscriptionCIDRsModel: SubscriptionCIDRsModel;

const Config = t.type({
  LEGACY_COSMOSDB_KEY: NonEmptyString,
  LEGACY_COSMOSDB_MOCKING: BooleanFromString,
  LEGACY_COSMOSDB_NAME: NonEmptyString,
  LEGACY_COSMOSDB_URI: NonEmptyString,
});

const getLegacyCosmosConfig = () => {
  const result = Config.decode(process.env);

  if (E.isLeft(result)) {
    throw new Error("error parsing legacy cosmos config", {
      cause: readableReport(result.left),
    });
  }
  return result.right;
};

const buildLegacyCosmosClient = (): CosmosClient => {
  const { LEGACY_COSMOSDB_KEY, LEGACY_COSMOSDB_URI } = getLegacyCosmosConfig();
  return new CosmosClient({
    endpoint: LEGACY_COSMOSDB_URI,
    key: LEGACY_COSMOSDB_KEY,
  });
};

const getLegacyCosmosClient = (): CosmosClient => {
  if (!legacyCosmosClient) {
    legacyCosmosClient = buildLegacyCosmosClient();
  }
  return legacyCosmosClient;
};

const buildSubscriptionCIDRsModel = (): SubscriptionCIDRsModel => {
  const { LEGACY_COSMOSDB_NAME } = getLegacyCosmosConfig();
  const cosmosContainer = getLegacyCosmosClient()
    .database(LEGACY_COSMOSDB_NAME)
    .container(SUBSCRIPTION_CIDRS_COLLECTION_NAME);

  return new SubscriptionCIDRsModel(cosmosContainer);
};

export const getSubscriptionCIDRsModel = (): SubscriptionCIDRsModel => {
  if (!subscriptionCIDRsModel) {
    subscriptionCIDRsModel = buildSubscriptionCIDRsModel();
  }
  return subscriptionCIDRsModel;
};

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
