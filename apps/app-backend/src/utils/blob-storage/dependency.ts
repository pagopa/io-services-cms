import { BlobServiceClient } from "@azure/storage-blob";

export type BlobServiceClientDependency = {
  readonly blobServiceClient: BlobServiceClient;
};
