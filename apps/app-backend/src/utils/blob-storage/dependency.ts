import { BlobService } from "azure-storage";
import { BlobServiceClient } from "@azure/storage-blob";

export type BlobServiceDependency = {
  readonly blobService: BlobService;
};

export type BlobServiceClientDependency = {
  readonly blobServiceClient: BlobServiceClient;
};
