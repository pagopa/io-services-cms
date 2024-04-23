import { CosmosClient } from "@azure/cosmos";
import { CosmosConfig } from "../../config";
import { ServiceDetailsContainerDependency } from "./dependency";

export const buildServiceDetailsContainerDependency = ({
  COSMOSDB_KEY,
  COSMOSDB_NAME,
  COSMOSDB_URI,
  COSMOSDB_CONTAINER_SERVICE_DETAILS,
}: CosmosConfig): ServiceDetailsContainerDependency => {
  const cosmosdbClient = new CosmosClient({
    endpoint: COSMOSDB_URI,
    key: COSMOSDB_KEY,
  });
  const serviceDetailsContainer = cosmosdbClient
    .database(COSMOSDB_NAME)
    .container(COSMOSDB_CONTAINER_SERVICE_DETAILS);
  return { serviceDetailsContainer };
};
