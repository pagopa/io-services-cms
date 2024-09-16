import { BlobServiceClient } from "@azure/storage-blob";

export interface BlobServiceClientDependency {
  readonly blobServiceClient: BlobServiceClient;
}
