import { AzureSearchClient } from "./client";

export interface AzureSearchClientDependency<T> {
  readonly searchClient: AzureSearchClient<T>;
}
