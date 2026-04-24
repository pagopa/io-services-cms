import { StateEnum as StateEnumNotReady } from "@/generated/api/AggregatedInstitutionsManageKeysLinkNotReady";
import { DefaultAzureCredential } from "@azure/identity";
import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";
import { readableReportSimplified } from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as t from "io-ts";
import {
  ApiKeysExportsPort,
  StateEnum,
} from "./subscriptions/api-keys-exports-port";
import { ManagedInternalError } from "./errors";

type Config = t.TypeOf<typeof Config>;
const Config = t.type({
  SA_EXT_BLOB_ENDPOINT: NonEmptyString,
  EXPORTS_API_KEYS_CONTAINER_NAME: NonEmptyString,
});

export class ApiKeysExportsAdapter implements ApiKeysExportsPort {
  private static instance: ApiKeysExportsAdapter;

  public static getInstance(
    environment: Record<string, unknown>,
  ): ApiKeysExportsAdapter {
    if (!ApiKeysExportsAdapter.instance) {
      ApiKeysExportsAdapter.instance = new ApiKeysExportsAdapter(environment);
    }
    return ApiKeysExportsAdapter.instance;
  }

  private blobContainerClient: ContainerClient;

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
  }

  async findExportsFiles(
    institutionId: string,
    userId: string,
    state?: StateEnum,
  ): Promise<
    {
      fileName: string;
      state?: StateEnum;
    }[]
  > {
    const blobs: {
      fileName: string;
      state?: StateEnum;
    }[] = [];
    const tagQuery =
      `"institutionId" = '${institutionId}' AND "userId" = '${userId}'` +
      (state ? ` AND "state" = '${state}'` : "");
    try {
      const result = this.blobContainerClient.findBlobsByTags(tagQuery);

      for await (const blob of result) {
        const stateResult = StateEnum.decode(blob.tags?.state);
        if (E.isLeft(stateResult)) {
          throw new Error(
            `Blob ${blob.name} has an invalid state tag: ${blob.tags?.state}`,
          );
        }
        blobs.push({ fileName: blob.name, state: stateResult.right });
      }
    } catch (error) {
      console.error("Errore durante la ricerca dei tag:", error);
    }

    if (blobs.length === 0) {
      console.log("Nessun blob trovato con i tag");
    }
    return Promise.resolve(blobs);
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
          userId,
          state: StateEnumNotReady.IN_PROGRESS,
        },
      });
    } catch (error) {
      throw new ManagedInternalError(
        "Errore durante l'inizializzazione del file",
        error instanceof Error ? error.message : error,
      );
    }
  }

  async finalizeFile(
    fileName: string,
    payload: string | Buffer,
    payloadContentType?: string,
  ): Promise<boolean> {
    const blockBlobClient =
      this.blobContainerClient.getBlockBlobClient(fileName);
    try {
      await blockBlobClient.upload(payload, payload.length, {
        tags: {
          state: StateEnumNotReady.IN_PROGRESS,
        },
        blobHTTPHeaders: {
          blobContentType: payloadContentType,
        },
      });
      return Promise.resolve(true);
    } catch (error) {
      console.error("Errore durante l'inizializzazione del file:", error);
      return Promise.resolve(false);
    }
  }

  async markFileAsFailed(fileName: string): Promise<boolean> {
    const blockBlobClient =
      this.blobContainerClient.getBlockBlobClient(fileName);
    try {
      await blockBlobClient.setTags({
        state: StateEnumNotReady.FAILED,
      });
      return Promise.resolve(true);
    } catch (error) {
      console.error(
        "Errore durante l'aggiornamento dello stato del file:",
        error,
      );
      return Promise.resolve(false);
    }
  }
}
