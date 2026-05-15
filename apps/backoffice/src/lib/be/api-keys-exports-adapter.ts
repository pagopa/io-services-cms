import { DefaultAzureCredential } from "@azure/identity";
import {
  BlobSASPermissions,
  BlobServiceClient,
  ContainerClient,
  generateBlobSASQueryParameters,
} from "@azure/storage-blob";
import { NumberFromString } from "@pagopa/ts-commons/lib/numbers";
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

type Config = t.TypeOf<typeof Config>;
const Config = t.type({
  EXPORTS_API_KEYS_CONTAINER_NAME: NonEmptyString,
  EXPORTS_API_KEYS_DURATION_IN_HOURS: NumberFromString,
  SA_EXT_BLOB_ENDPOINT: NonEmptyString,
});

export class ApiKeysExportsAdapter implements ApiKeysExportsPort {
  private blobContainerClient: ContainerClient;
  private blobServiceClient: BlobServiceClient;
  private static instance: ApiKeysExportsAdapter;
  public EXPORTS_API_KEYS_DURATION_IN_HOURS: NumberFromString;

  private constructor(environment: Record<string, unknown>) {
    const result = Config.decode(environment);
    if (E.isLeft(result)) {
      throw new Error("error parsing blob storage config", {
        cause: readableReportSimplified(result.left),
      });
    }
    this.blobServiceClient = new BlobServiceClient(
      result.right.SA_EXT_BLOB_ENDPOINT,
      new DefaultAzureCredential(),
    );
    this.blobContainerClient = this.blobServiceClient.getContainerClient(
      result.right.EXPORTS_API_KEYS_CONTAINER_NAME,
    );
    this.EXPORTS_API_KEYS_DURATION_IN_HOURS =
      result.right.EXPORTS_API_KEYS_DURATION_IN_HOURS;
  }

  public static getInstance(
    environment: Record<string, unknown>,
  ): ApiKeysExportsAdapter {
    if (!ApiKeysExportsAdapter.instance) {
      ApiKeysExportsAdapter.instance = new ApiKeysExportsAdapter(environment);
    }
    return ApiKeysExportsAdapter.instance;
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
    const prefix = `${institutionId}_${userId}`;
    try {
      const result = this.blobContainerClient.listBlobsFlat({
        includeTags: true,
        prefix,
      });

      for await (const blob of result) {
        const creationDate = blob.properties.createdOn;
        const lastModifiedDate = blob.properties.lastModified;

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

        if (state && stateResult.right !== state) {
          continue;
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
    const startsOn = new Date();
    const blobClient = this.blobContainerClient.getBlobClient(fileName);

    try {
      // Request a short-lived User Delegation Key (valid 5 minutes) needed to sign the SAS token
      // when authenticating via DefaultAzureCredential instead of a storage account key.
      const userDelegationKey =
        await this.blobServiceClient.getUserDelegationKey(
          startsOn,
          new Date(startsOn.getTime() + 300 * 1000),
        );

      const sasToken = generateBlobSASQueryParameters(
        {
          blobName: fileName,
          containerName: this.blobContainerClient.containerName,
          expiresOn: expirationDate,
          permissions: BlobSASPermissions.parse("r"),
          startsOn,
        },
        userDelegationKey,
        this.blobServiceClient.accountName,
      );

      return new URL(`${blobClient.url}?${sasToken.toString()}`);
    } catch (error) {
      throw new ManagedInternalError(
        `Error generating download URL for file ${fileName}`,
        error instanceof Error ? error.message : error,
      );
    }
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
