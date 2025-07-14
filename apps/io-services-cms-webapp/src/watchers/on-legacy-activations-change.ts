import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";
import { Activations, DateUtils } from "@io-services-cms/models";
import * as E from "fp-ts/lib/Either";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import { BlobStorageClientConfiguration } from "../config";

const noAction = {};
type Actions = "migrationError";
type MigrationSuccess = typeof noAction;
type Action<A extends Actions, B> = Record<A, B>;
type MigrationError<S> = Action<"migrationError", S>;
export type MigrationResults<S> = MigrationError<S> | MigrationSuccess;

/**
 * Converts a legacy activation resource to the CMS activation format.
 *
 * @param legacy - The legacy activation resource to convert.
 * @returns The converted activation in CMS format.
 */
const legacyToCms = (
  legacy: Activations.LegacyCosmosResource,
): Activations.Activation => ({
  fiscalCode: legacy.fiscalCode,
  modifiedAt: calculateModifiedAt(legacy._ts),
  serviceId: legacy.serviceId,
  status: legacy.status,
});

const calculateModifiedAt = (ts: number) => DateUtils.unixSecondsToMillis(ts);

interface HandlerDependencies {
  readonly blobContainerClient: ContainerClient;
}

export const handler =
  ({
    blobContainerClient,
  }: HandlerDependencies): RTE.ReaderTaskEither<
    { item: Activations.LegacyCosmosResource },
    Error,
    void
  > =>
  ({ item }) =>
    pipe(
      item,
      legacyToCms,
      (cmsItem) => ({ cmsItem, serializedCmsItem: JSON.stringify(cmsItem) }),
      TE.tryCatchK(
        ({ cmsItem, serializedCmsItem }) =>
          blobContainerClient.uploadBlockBlob(
            `${cmsItem.fiscalCode}/${cmsItem.serviceId}.json`,
            serializedCmsItem,
            Buffer.byteLength(serializedCmsItem),
            { tags: { fiscalCode: cmsItem.fiscalCode } },
          ),
        E.toError,
      ),
      TE.map(() => void 0),
    );
