import { CosmosClient } from "@azure/cosmos";
import { DefaultAzureCredential } from "@azure/identity";

import { CosmosConfig } from "../../config";
import { ServiceDetailsContainerDependency } from "./dependency";

export const buildServiceDetailsContainerDependency = ({
  COSMOSDB_CONTAINER_SERVICE_DETAILS,
  COSMOSDB_KEY,
  COSMOSDB_NAME,
  COSMOSDB_URI,
}: CosmosConfig): ServiceDetailsContainerDependency => {
  const authentication = COSMOSDB_KEY
    ? {
        key: COSMOSDB_KEY,
      }
    : {
        aadCredentials: new DefaultAzureCredential(),
      };
  const cosmosdbClient = new CosmosClient({
    ...authentication,
    endpoint: COSMOSDB_URI,
  });
  const serviceDetailsContainer = cosmosdbClient
    .database(COSMOSDB_NAME)
    .container(COSMOSDB_CONTAINER_SERVICE_DETAILS);
  return { serviceDetailsContainer };
};
