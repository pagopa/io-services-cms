import { pipe } from "fp-ts/lib/function";

import * as TE from "fp-ts/lib/TaskEither";

import {
  HealthCheck,
  toHealthProblems,
} from "@pagopa/io-functions-commons/dist/src/utils/healthcheck";

import { FeaturedItemsConfig } from "../../config";
import { BlobServiceClientDependency } from "./dependency";

export type AzureBlobStorageProblemSource = "AzureBlobStorage";

// : HealthCheck<AzureBlobStorageProblemSource>
export const makeAzureBlobStorageHealthCheck =
  (featuredItemsConfig: FeaturedItemsConfig) =>
  ({
    blobServiceClient,
  }: BlobServiceClientDependency): HealthCheck<AzureBlobStorageProblemSource> =>
    pipe(
      TE.tryCatch(async () => {
        const containerClient = blobServiceClient.getContainerClient(
          featuredItemsConfig.FEATURED_ITEMS_CONTAINER_NAME
        );
        const response = containerClient.listBlobsFlat();
        const blobNames = [];
        for await (const blob of response) {
          // eslint-disable-next-line functional/immutable-data
          blobNames.push(blob.name);
        }
        if (
          !blobNames.includes(
            featuredItemsConfig.FEATURED_INSTITUTIONS_FILE_NAME
          ) ||
          !blobNames.includes(featuredItemsConfig.FEATURED_SERVICES_FILE_NAME)
        ) {
          throw new Error("Required blob files are missing");
        }
      }, toHealthProblems("AzureBlobStorage" as const)),
      TE.map(() => true)
    );
