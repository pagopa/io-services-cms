import { DefaultAzureCredential } from "@azure/identity";
import {
  BlobSASPermissions,
  BlobServiceClient,
  ContainerClient,
} from "@azure/storage-blob";
import { readableReportSimplified } from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as t from "io-ts";
import Stream from "stream";

import { ManagedInternalError } from "./errors";
import {
  ApiKeysExportsPort,
  FileState,
  FileStateEnum,
} from "./subscriptions/api-keys-exports-port";
import { NonNegativeInteger } from "@pagopa/ts-commons/lib/numbers";

type Config = t.TypeOf<typeof Config>;
const Config = t.type({
  EXPORTS_API_KEYS_CONTAINER_NAME: NonEmptyString,
  EXPORTS_API_KEYS_DURATION_IN_HOURS: NonNegativeInteger,
  SA_EXT_BLOB_ENDPOINT: NonEmptyString,
});

export class ApiKeysExportsAdapter implements ApiKeysExportsPort {
  private blobContainerClient: ContainerClient;
  private static instance: ApiKeysExportsAdapter;
  public EXPORTS_API_KEYS_DURATION_IN_HOURS: NonNegativeInteger;

  private constructor(environment: Record<string, unknown>) {
    const result = Config.decode(environment);
    if (E.isLeft(result)) {
      throw new Error("error parsing blob storage config", {
        cause: readableReportSimplified(result.left),
      });
    }
    const blobServiceClient = new BlobServiceClient(
      result.right.SA_EXT_BLOB_ENDPOINT,
      new DefaultAzureCredential(),
    );
    this.blobContainerClient = blobServiceClient.getContainerClient(
      result.right.EXPORTS_API_KEYS_CONTAINER_NAME,
    );
    this.EXPORTS_API_KEYS_DURATION_IN_HOURS =
      result.right.EXPORTS_API_KEYS_DURATION_IN_HOURS;
  }

  async finalizeFile(
    aggregatorId: string,
    userId: string,
    fileName: string,
    payload: Stream.Readable,
    payloadContentType?: string,
  ): Promise<void> {
    const blockBlobClient =
      this.blobContainerClient.getBlockBlobClient(fileName);

    try {
      await blockBlobClient.uploadStream(payload, undefined, undefined, {
        blobHTTPHeaders: {
          blobContentType: payloadContentType,
        },
        tags: {
          institutionId: aggregatorId,
          state: FileStateEnum.DONE,
          userId,
        },
      });
    } catch (error) {
      throw new ManagedInternalError(
        `Error uploading file \`${fileName}\``,
        error instanceof Error ? error.message : error,
      );
    }
  }

  async findExportsFiles(
    institutionId: string,
    userId: string,
    state?: FileState,
  ): Promise<
    {
      creationDate: Date;
      fileName: string;
      lastModifiedDate: Date;
      state: FileState;
    }[]
  > {
    const blobs: {
      creationDate: Date;
      fileName: string;
      lastModifiedDate: Date;
      state: FileState;
    }[] = [];
    const tagQuery =
      `"institutionId" = '${institutionId}' AND "userId" = '${userId}'` +
      (state ? ` AND "state" = '${state}'` : "");
    try {
      const result = this.blobContainerClient.findBlobsByTags(tagQuery);

      for await (const blob of result) {
        const blobClient = this.blobContainerClient.getBlobClient(blob.name);
        const { createdOn: creationDate, lastModified: lastModifiedDate } =
          await blobClient.getProperties();

        if (
          !(creationDate instanceof Date) ||
          !(lastModifiedDate instanceof Date)
        ) {
          throw new Error(
            `Blob ${blob.name} has an invalid dates properties: ${creationDate} ${lastModifiedDate}`,
          );
        }

        const stateResult = FileState.decode(blob.tags?.state);
        if (E.isLeft(stateResult)) {
          throw new Error(
            `Blob ${blob.name} has an invalid state tag: ${blob.tags?.state}`,
          );
        }
        blobs.push({
          creationDate,
          fileName: blob.name,
          lastModifiedDate,
          state: stateResult.right,
        });
      }
    } catch (error) {
      throw new ManagedInternalError(
        "Error finding exports files",
        error instanceof Error ? error.message : error,
      );
    }

    return Promise.resolve(blobs);
  }

  async generateDownloadUrl(
    fileName: string,
    expirationDate?: Date,
  ): Promise<URL> {
    const blobClient = this.blobContainerClient.getBlobClient(fileName);

    // "r" = read permissions
    const permissions = BlobSASPermissions.parse("r");

    const sasUrl = await blobClient.generateSasUrl({
      expiresOn: expirationDate,
      permissions,
    });

    return new URL(sasUrl);
  }

  async initializeFile(
    fileName: string,
    institutionId: string,
    userId: string,
  ): Promise<void> {
    const blockBlobClient =
      this.blobContainerClient.getBlockBlobClient(fileName);

    try {
      await blockBlobClient.upload("", 0, {
        tags: {
          institutionId,
          state: FileStateEnum.IN_PROGRESS,
          userId,
        },
      });
    } catch (error) {
      throw new ManagedInternalError(
        "Errore durante l'inizializzazione del file",
        error instanceof Error ? error.message : error,
      );
    }
  }

  async markFileAsFailed(
    fileName: string,
    institutionId: string,
    userId: string,
  ): Promise<void> {
    const blockBlobClient =
      this.blobContainerClient.getBlockBlobClient(fileName);
    try {
      await blockBlobClient.setTags({
        institutionId,
        state: FileStateEnum.FAILED,
        userId,
      });
    } catch (error) {
      throw new ManagedInternalError(
        `Error marking file \`${fileName}\` as failed`,
        error instanceof Error ? error.message : error,
      );
    }
  }
}
