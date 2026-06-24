import { DefaultAzureCredential } from "@azure/identity";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { afterEach, describe, expect, it, vi } from "vitest";

import { makeInfoHandler } from "../info";

const mocks = vi.hoisted(() => {
  const credential = { getToken: vi.fn() };
  const config = {
    ACTIVATIONS_CONTAINER_NAME: "activations",
    CMS_COSMOSDB__accountEndpoint: "https://cms.documents.azure.com:443/",
    CMS_INTERNAL_STORAGE__blobServiceUri: "https://cms.blob.core.windows.net",
    CMS_INTERNAL_STORAGE__queueServiceUri: "https://cms.queue.core.windows.net",
    CMS_LEGACY_COSMOSDB__accountEndpoint:
      "https://legacy.documents.azure.com:443/",
    REQUEST_REVIEW_QUEUE: "request-review",
    SERVICES_EVENT_HUB_FULLY_QUALIFIED_NAMESPACE:
      "namespace.servicebus.windows.net",
    SERVICES_PUBLICATION_EVENT_HUB_NAME: "publication",
    USE_MANAGED_IDENTITY: true,
  };

  const queueClient = {
    peekMessages: vi.fn().mockResolvedValue(undefined),
  };
  const containerClient = {
    getProperties: vi.fn().mockResolvedValue(undefined),
  };
  const cosmosClient = {
    getDatabaseAccount: vi.fn().mockResolvedValue(undefined),
  };
  const eventHubProducerClient = {
    close: vi.fn().mockResolvedValue(undefined),
    getEventHubProperties: vi.fn().mockResolvedValue(undefined),
  };

  return {
    BlobServiceClient: vi.fn(() => ({
      getContainerClient: vi.fn(() => containerClient),
    })),
    EventHubProducerClient: vi.fn(() => eventHubProducerClient),
    QueueServiceClient: vi.fn(() => ({
      getQueueClient: vi.fn(() => queueClient),
    })),
    checkApplicationHealth: vi.fn(
      (_codec, checks) => (input) =>
        pipe(
          checks[0](input),
          TE.chain(() => checks[1](input)),
        ),
    ),
    checkPostgresDbHealth: vi.fn(() => TE.right(true as const)),
    config,
    containerClient,
    cosmosClient,
    createManagedIdentityCosmosClient: vi.fn(() => cosmosClient),
    credential,
    envConfig: config,
    eventHubProducerClient,
    queueClient,
    ResponseErrorInternal: vi.fn((message: string) => ({
      detail: message,
      status: 500,
    })),
    ResponseSuccessJson: vi.fn((payload: unknown) => ({
      jsonBody: payload,
      status: 200,
    })),
    toHealthProblems: vi.fn(() => (error: unknown) => [String(error)]),
  };
});

vi.mock("@azure/event-hubs", () => ({
  EventHubProducerClient: mocks.EventHubProducerClient,
}));

vi.mock("@azure/storage-blob", () => ({
  BlobServiceClient: mocks.BlobServiceClient,
}));

vi.mock("@azure/storage-queue", () => ({
  QueueServiceClient: mocks.QueueServiceClient,
}));

vi.mock("@pagopa/io-functions-commons/dist/src/utils/healthcheck", () => ({
  checkApplicationHealth: mocks.checkApplicationHealth,
  toHealthProblems: mocks.toHealthProblems,
}));

vi.mock("@pagopa/ts-commons/lib/responses", () => ({
  ResponseErrorInternal: mocks.ResponseErrorInternal,
  ResponseSuccessJson: mocks.ResponseSuccessJson,
}));

vi.mock("../../../config", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../config")>();
  return {
    ...actual,
    envConfig: mocks.envConfig,
  };
});

vi.mock("../../../lib/azure/cosmos", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../../lib/azure/cosmos")>();
  return {
    ...actual,
    createManagedIdentityCosmosClient: mocks.createManagedIdentityCosmosClient,
  };
});

vi.mock("../../../lib/clients/pg-client", () => ({
  healthcheck: mocks.checkPostgresDbHealth,
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe("makeInfoHandler", () => {
  it("should reuse the injected credential for managed identity health checks", async () => {
    const handler = makeInfoHandler(
      mocks.credential as unknown as DefaultAzureCredential,
    );

    const response = await handler();

    expect(response.status).toBe(200);
    expect(mocks.QueueServiceClient).toHaveBeenCalledWith(
      mocks.config.CMS_INTERNAL_STORAGE__queueServiceUri,
      mocks.credential,
    );
    expect(mocks.BlobServiceClient).toHaveBeenCalledWith(
      mocks.config.CMS_INTERNAL_STORAGE__blobServiceUri,
      mocks.credential,
    );
    expect(mocks.createManagedIdentityCosmosClient).toHaveBeenNthCalledWith(
      1,
      mocks.config.CMS_COSMOSDB__accountEndpoint,
      mocks.credential,
    );
    expect(mocks.createManagedIdentityCosmosClient).toHaveBeenNthCalledWith(
      2,
      mocks.config.CMS_LEGACY_COSMOSDB__accountEndpoint,
      mocks.credential,
    );
    expect(mocks.EventHubProducerClient).toHaveBeenCalledWith(
      mocks.config.SERVICES_EVENT_HUB_FULLY_QUALIFIED_NAMESPACE,
      mocks.config.SERVICES_PUBLICATION_EVENT_HUB_NAME,
      mocks.credential,
    );
    expect(mocks.eventHubProducerClient.close).toHaveBeenCalledOnce();
  });
});
