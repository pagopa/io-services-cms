import { identity, pipe } from "fp-ts/lib/function";

import * as B from "fp-ts/boolean";
import * as TE from "fp-ts/lib/TaskEither";

import {
  HealthCheck,
  toHealthProblems,
} from "@pagopa/io-functions-commons/dist/src/utils/healthcheck";

import { FeaturedItemsConfig } from "../../config";
import { BlobServiceClientDependency } from "./dependency";

export type AzureBlobStorageProblemSource = "AzureBlobStorage";

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
        return blobNames;
      }, identity),
      TE.chainW((blobNames) =>
        pipe(
          blobNames.includes(
            featuredItemsConfig.FEATURED_INSTITUTIONS_FILE_NAME
          ) &&
            blobNames.includes(featuredItemsConfig.FEATURED_SERVICES_FILE_NAME),
          B.fold(
            () => TE.left(new Error("Required blob files are missing")),
            () => TE.right(true as const)
          )
        )
      ),
      TE.mapLeft(toHealthProblems("AzureBlobStorage" as const))
    );
