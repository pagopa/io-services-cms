import { CosmosClient, Database } from "@azure/cosmos";
import { CosmosConfig } from "../../config";

export const getDatabase = ({
  COSMOSDB_KEY,
  COSMOSDB_NAME,
  COSMOSDB_URI,
}: CosmosConfig): Database => {
  const cosmosdbClient = new CosmosClient({
    endpoint: COSMOSDB_URI,
    key: COSMOSDB_KEY,
  });
  return cosmosdbClient.database(COSMOSDB_NAME);
};
