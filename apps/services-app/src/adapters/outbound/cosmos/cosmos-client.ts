import { CosmosClient } from "@azure/cosmos";
import { ManagedIdentityCredential } from "@azure/identity";

/**
 * Creates a Cosmos DB client authenticated through Azure Managed Identity.
 *
 * @param endpoint - The Cosmos DB account endpoint.
 * @returns A Cosmos DB client configured with Managed Identity credentials.
 */
export const createManagedIdentityCosmosClient = (
  endpoint: string,
): CosmosClient =>
  new CosmosClient({
    aadCredentials: new ManagedIdentityCredential(),
    endpoint,
  });

/**
 * Creates a Cosmos DB client from a connection string.
 *
 * @param connectionString - The Cosmos DB account connection string.
 * @returns A Cosmos DB client configured from the connection string.
 */
export const createConnectionStringCosmosClient = (
  connectionString: string,
): CosmosClient => new CosmosClient(connectionString);
