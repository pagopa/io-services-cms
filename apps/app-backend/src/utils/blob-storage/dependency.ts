import { BlobService } from "azure-storage";

export type BlobServiceDependency = {
    readonly blobService: BlobService;
  };