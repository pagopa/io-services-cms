import { Configuration, getConfiguration } from "@/config";
import { CosmosClient } from "@azure/cosmos";
import {
  SUBSCRIPTION_CIDRS_COLLECTION_NAME,
  SubscriptionCIDRsModel
} from "@pagopa/io-functions-commons/dist/src/models/subscription_cidrs";

let instance: SubscriptionCIDRsModel;

export const getSubscriptionCIDRsModelInstance = () => {
  if (!instance) {
    const config = getConfiguration();
    instance = buildSubscriptionCIDRsModel(config);
  }

  return instance;
};

const buildSubscriptionCIDRsModel = (
  configuration: Configuration
): SubscriptionCIDRsModel => {
  const cosmosdbClient = new CosmosClient({
    endpoint: configuration.LEGACY_COSMOSDB_URI,
    key: configuration.LEGACY_COSMOSDB_KEY
  });

  const cosmosdbInstance = cosmosdbClient.database(
    configuration.LEGACY_COSMOSDB_NAME
  );

  return new SubscriptionCIDRsModel(
    cosmosdbInstance.container(SUBSCRIPTION_CIDRS_COLLECTION_NAME)
  );
};
