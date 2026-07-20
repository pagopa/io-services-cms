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
 * Creates a Cosmos DB client authenticated through an account key.
 *
 * @param endpoint - The Cosmos DB account endpoint.
 * @param key - The Cosmos DB account key.
 * @returns A Cosmos DB client configured with key-based authentication.
 */
export const createKeyCosmosClient = (
  endpoint: string,
  key: string,
): CosmosClient => new CosmosClient({ endpoint, key });
