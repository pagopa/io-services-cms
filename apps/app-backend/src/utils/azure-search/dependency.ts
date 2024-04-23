import { AzureSearchClient } from "./client";

export type AzureSearchClientDependency<T> = {
  readonly searchClient: AzureSearchClient<T>;
};
