import { AzureFunction, Context } from "@azure/functions";
import * as RTE from "fp-ts/ReaderTaskEither";
import { pipe } from "fp-ts/lib/function";
import { beforeEach, describe, expect, it, test, vi } from "vitest";
import {
  activationsSyncFromLegacyEntryPoint,
  onSelfcareGroupChangeEntryPoint,
} from "../main";

const mocks = vi.hoisted(() => {
  const config = {
    AZURE_SUBSCRIPTION_ID: "test-sub",
    AZURE_APIM_RESOURCE_GROUP: "test-group",
    AZURE_APIM: "test-apim",
    AZURE_APIM_SUBSCRIPTION_PRODUCT_NAME: "test-product",
    COSMOSDB_CONTAINER_SERVICES_LIFECYCLE: "test-lifecycle",
    COSMOSDB_CONTAINER_SERVICES_PUBLICATION: "test-publication",
    COSMOSDB_CONTAINER_SERVICES_HISTORY: "test-history",
    COSMOSDB_CONTAINER_SERVICES_DETAILS: "test-details",
    LEGACY_COSMOSDB_NAME: "test-legacy",
    ASSET_STORAGE_CONNECTIONSTRING: "test-storage",
    SERVICES_PUBLICATION_EVENT_HUB_CONNECTION_STRING: "test-pub-conn",
    SERVICES_PUBLICATION_EVENT_HUB_NAME: "test-pub-name",
    SERVICES_TOPICS_EVENT_HUB_CONNECTION_STRING: "test-topics-conn",
    SERVICES_TOPICS_EVENT_HUB_NAME: "test-topics-name",
    SERVICES_LIFECYCLE_EVENT_HUB_CONNECTION_STRING: "test-lifecycle-conn",
    SERVICES_LIFECYCLE_EVENT_HUB_NAME: "test-lifecycle-name",
    SERVICES_HISTORY_EVENT_HUB_CONNECTION_STRING: "test-history-conn",
    SERVICES_HISTORY_EVENT_HUB_NAME: "test-history-name",
    APPINSIGHTS_INSTRUMENTATIONKEY: "test-key",
    ACTIVATIONS_CONTAINER_NAME: "test-activations",
  };

  const mockEventHubProducer = {
    close: vi.fn(),
    send: vi.fn(),
  };

  const mockContainer = {
    items: vi.fn(),
    item: vi.fn(),
  };

  const mockPagedHelper = {
    fetch: vi.fn(),
    getIterator: vi.fn(),
  };

  const mockCosmosHelperTest = {
    find: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };
  return {
    getConfigOrThrow: vi.fn(() => config),
    config: config,
    ApimUtils: {
      getApimClient: vi.fn(() => {}),
      getApimService: vi.fn().mockReturnValue({}),
    },
    makeCosmosPagedHelper: vi.fn((...args: any[]) => mockPagedHelper),
    makeCosmosHelper: vi.fn().mockReturnValue(mockCosmosHelperTest),
    getCmsCosmosDatabase: vi.fn().mockReturnValue({
      container: vi.fn().mockReturnValue(mockContainer),
    }),
    getAppBackendCosmosDatabase: vi.fn().mockReturnValue({
      container: vi.fn().mockReturnValue(mockContainer),
    }),
    cosmosdbClient: {
      database: vi.fn().mockReturnValue({
        container: vi.fn().mockReturnValue(mockContainer),
      }),
    },
    cosmosdbInstance: {
      container: vi.fn().mockReturnValue(mockContainer),
    },

    ServiceModel: vi.fn().mockImplementation(() => ({
      find: vi.fn(),
      create: vi.fn(),
    })),
    SubscriptionCIDRsModel: vi.fn().mockImplementation(() => ({
      find: vi.fn(),
      upsert: vi.fn(),
    })),

    stores: {
      createCosmosStore: vi.fn((x: any, y: any) => {}),
    },
    ServiceLifecycle: {
      getFsmClient: vi.fn((...args: any[]) => () => {}),
    },
    ServicePublication: {
      getFsmClient: vi.fn().mockReturnValue({
        get: vi.fn(),
        update: vi.fn(),
      }),
    },
    EventHubProducerClient: vi.fn(() => mockEventHubProducer),
    createBlobService: vi.fn().mockReturnValue({
      createBlockBlobFromText: vi.fn(),
    }),
    initTelemetryClient: vi.fn().mockReturnValue({
      trackEvent: vi.fn(),
      trackException: vi.fn(),
    }),
    makeOnSelfcareGroupChangeHandler: vi.fn(),
    makeOnLegacyActivationChangeHandler: vi.fn(),
    SUBSCRIPTION_CIDRS_COLLECTION_NAME: "test",
    SERVICE_COLLECTION_NAME: "test",
    envConfig: {},
    makeInfoHandler: vi.fn(() => {}),
    createWebServer: vi.fn(() => {}),
    createServiceValidationHandler: vi.fn((...args: any[]) => {}),
    processBatchOf: vi.fn(
      () =>
        <L = Error, A = unknown>(
          rte: RTE.ReaderTaskEither<any, L, A>,
        ): RTE.ReaderTaskEither<any, L, A> =>
          rte,
    ),
    createRequestReviewHandler: vi.fn((...args: any[]) => {}),
    createRequestActivationIngestionRetryHandler: vi.fn((...args: any[]) => {}),
    toAzureFunctionHandler: vi.fn(
      <L, R>(
        procedure: RTE.ReaderTaskEither<
          {
            context: Context;
            inputs: unknown[];
          },
          L,
          R
        >,
      ): AzureFunction =>
        (context, ...inputs) =>
          pipe(
            procedure,
            RTE.getOrElseW((f) => {
              const error =
                f instanceof Error ? f : new Error("Unexpected error");
              throw error;
            }),
          )({ context, inputs })(),
    ),
    setBindings: vi.fn((...args: any[]) => () => {}),
  };
});

vi.mock("../config", () => {
  return {
    getConfigOrThrow: mocks.getConfigOrThrow,
    envConfig: mocks.envConfig,
  };
});

vi.mock("@io-services-cms/external-clients", () => ({
  ApimUtils: {
    ...mocks.ApimUtils,
  },
}));

vi.mock("../webservice/controllers/info", () => ({
  makeInfoHandler: mocks.makeInfoHandler,
}));

vi.mock("../webservice/index", () => ({
  createWebServer: mocks.createWebServer,
}));

vi.mock("../lib/azure/cosmos", () => ({
  getCmsCosmosDatabase: mocks.getCmsCosmosDatabase,
  getAppBackendCosmosDatabase: mocks.getAppBackendCosmosDatabase,
}));

vi.mock("../lib/azure/misc", async (importOriginal) => {
  const actual = (await importOriginal()) as any;
  return {
    ...actual,
    processBatchOf: mocks.processBatchOf,
    setBindings: mocks.setBindings,
  };
});

vi.mock("../lib/azure/adapters", async (importOriginal) => {
  const actual = (await importOriginal()) as any;
  return {
    ...actual,
    toAzureFunctionHandler: mocks.toAzureFunctionHandler,
  };
});

vi.mock("../utils/cosmos-helper", () => ({
  makeCosmosHelper: mocks.makeCosmosHelper,
  makeCosmosPagedHelper: mocks.makeCosmosPagedHelper,
}));

vi.mock("../utils/cosmos-legacy", () => ({
  cosmosdbClient: mocks.cosmosdbClient,
  cosmosdbInstance: mocks.cosmosdbInstance,
}));

vi.mock("@azure/event-hubs", () => ({
  EventHubProducerClient: mocks.EventHubProducerClient,
}));

vi.mock("azure-storage", () => ({
  createBlobService: mocks.createBlobService,
}));

vi.mock("../utils/applicationinsight", () => ({
  initTelemetryClient: mocks.initTelemetryClient,
}));

vi.mock("../reviewer/service-validation-handler", () => {
  return {
    createServiceValidationHandler: mocks.createServiceValidationHandler,
  };
});

vi.mock("../reviewer/request-review-handler", () => {
  return {
    createRequestReviewHandler: mocks.createRequestReviewHandler,
  };
});

vi.mock("../ingestion/request-activation-ingestion-retry-handler", () => {
  return {
    createRequestActivationIngestionRetryHandler:
      mocks.createRequestActivationIngestionRetryHandler,
  };
});

vi.mock("../watchers/on-selfcare-group-change", () => {
  return {
    makeHandler: mocks.makeOnSelfcareGroupChangeHandler,
  };
});

vi.mock("@io-services-cms/models", async (importOriginal) => {
  const actual = (await importOriginal()) as any;
  return {
    ...actual,
    ServiceLifecycle: {
      ...mocks.ServiceLifecycle,
    },
    ServicePublication: mocks.ServicePublication,
    stores: mocks.stores,
  };
});

vi.mock("../watchers/on-legacy-activations-change", () => {
  return {
    makeHandler: mocks.makeOnLegacyActivationChangeHandler,
  };
});

vi.mock("@pagopa/io-functions-commons/dist/src/models/service", () => {
  return {
    ServiceModel: mocks.ServiceModel,
    SERVICE_COLLECTION_NAME: mocks.SERVICE_COLLECTION_NAME,
  };
});

vi.mock(
  "@pagopa/io-functions-commons/dist/src/models/subscription_cidrs",
  () => {
    return {
      SUBSCRIPTION_CIDRS_COLLECTION_NAME:
        mocks.SUBSCRIPTION_CIDRS_COLLECTION_NAME,
      SubscriptionCIDRsModel: mocks.SubscriptionCIDRsModel,
    };
  },
);

beforeEach(() => {
  vi.restoreAllMocks();
});

test("it works", () => {
  expect(1).toBe(1);
});
describe("main", () => {
  const mockLogger = {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    verbose: vi.fn(),
    metric: vi.fn(),
  };
  const createMockContext = (
    retryCount: number = 0,
    maxRetryCount: number = 3,
  ): Context =>
    ({
      invocationId: "test-invocation-id",
      executionContext: {
        retryContext: {
          retryCount,
          maxRetryCount,
        },
      },
      bindings: {
        syncGroupPoisonQueue: undefined,
      },
      bindingData: {},
      traceContext: {
        traceparent: "",
        tracestate: "",
        attributes: {},
      },
      bindingDefinitions: [],
      log: mockLogger,
    }) as unknown as Context;

  describe("onSelfcareGroupChangeEntryPoint", () => {
    it("should fail when handler fails when the max retries are not reached", async () => {
      //given
      const context = createMockContext(1, 3);
      const args = [{ testData: "test" }];
      const error = new Error("error from makeOnSelfcareGroupChangeHandler");
      mocks.makeOnSelfcareGroupChangeHandler.mockImplementationOnce(() =>
        RTE.left(error),
      );

      //when and then
      await expect(
        onSelfcareGroupChangeEntryPoint(context, args),
      ).rejects.toThrow(error);
      expect(context.bindings.syncGroupPoisonQueue).toBeUndefined();
      expect(mocks.processBatchOf).toHaveBeenCalledOnce();
      expect(mocks.makeOnSelfcareGroupChangeHandler).toHaveBeenCalledOnce();
    });

    it("should fail when handler fails when the max retries are reached", async () => {
      //given
      const context = createMockContext(3, 3);
      const args = [{ testData: "test" }];
      const error = new Error("error from makeOnSelfcareGroupChangeHandler");
      mocks.makeOnSelfcareGroupChangeHandler.mockImplementationOnce(() =>
        RTE.left(error),
      );

      //when
      const result = await onSelfcareGroupChangeEntryPoint(context, args);
      //then
      expect(result).toStrictEqual([]);
      expect(context.bindings.syncGroupPoisonQueue).toStrictEqual(
        JSON.stringify(args),
      );
      expect(mocks.processBatchOf).toHaveBeenCalledOnce();
      expect(mocks.makeOnSelfcareGroupChangeHandler).toHaveBeenCalledOnce();
    });

    it("should success", async () => {
      //given
      const context = createMockContext(3, 3);
      const args = [{ testData: "test" }];
      mocks.makeOnSelfcareGroupChangeHandler.mockImplementationOnce(() =>
        RTE.right(args),
      );

      //when
      const result = await onSelfcareGroupChangeEntryPoint(context, args);
      //then
      expect(result).toStrictEqual(args);
      expect(context.bindings.syncGroupPoisonQueue).toBeUndefined();

      expect(mocks.processBatchOf).toHaveBeenCalledOnce();
      expect(mocks.makeOnSelfcareGroupChangeHandler).toHaveBeenCalledOnce();
    });
  });

  describe("activationsSyncFromLegacyEntryPoint", () => {
    it("should fail when handler fails when the max retries are not reached", async () => {
      //given
      const context = createMockContext(1, 3);
      const args = [{ testData: "test" }];
      const error = new Error("error from makeOnLegacyActivationChangeHandler");
      mocks.makeOnLegacyActivationChangeHandler.mockImplementationOnce(() =>
        RTE.left(error),
      );

      //when and then
      await expect(
        activationsSyncFromLegacyEntryPoint(context, args),
      ).rejects.toThrow(error);
      expect(
        context.bindings.activationsSyncFromLegacyPoisonQueue,
      ).toBeUndefined();
      expect(mocks.processBatchOf).toHaveBeenCalledOnce();
      expect(mocks.makeOnLegacyActivationChangeHandler).toHaveBeenCalledOnce();
      expect(mocks.makeOnLegacyActivationChangeHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          blobContainerClient: expect.objectContaining({
            containerName: mocks.config.ACTIVATIONS_CONTAINER_NAME,
          }),
        }),
      );
    });
    it("should fail when handler fails when the max retries are reached", async () => {
      //given
      const context = createMockContext(3, 3);
      const args = [{ testData: "test" }];
      const error = new Error("error from makeOnLegacyActivationChangeHandler");
      mocks.makeOnLegacyActivationChangeHandler.mockImplementationOnce(() =>
        RTE.left(error),
      );
      //when
      const result = await activationsSyncFromLegacyEntryPoint(context, args);
      //then
      expect(result).toStrictEqual([]);
      expect(
        context.bindings.activationsSyncFromLegacyPoisonQueue,
      ).toStrictEqual(JSON.stringify(args));
      expect(mocks.processBatchOf).toHaveBeenCalledOnce();
      expect(mocks.makeOnLegacyActivationChangeHandler).toHaveBeenCalledOnce();
      expect(mocks.makeOnLegacyActivationChangeHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          blobContainerClient: expect.objectContaining({
            containerName: mocks.config.ACTIVATIONS_CONTAINER_NAME,
          }),
        }),
      );
    });
    it("should success", async () => {
      //given
      const context = createMockContext(3, 3);
      const args = [{ testData: "test" }];
      mocks.makeOnLegacyActivationChangeHandler.mockImplementationOnce(() =>
        RTE.right(args),
      );
      //when
      const result = await activationsSyncFromLegacyEntryPoint(context, args);
      //then
      expect(result).toStrictEqual(args);
      expect(
        context.bindings.activationsSyncFromLegacyPoisonQueue,
      ).toBeUndefined();
      expect(mocks.processBatchOf).toHaveBeenCalledOnce();
      expect(mocks.makeOnLegacyActivationChangeHandler).toHaveBeenCalledOnce();
      expect(mocks.makeOnLegacyActivationChangeHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          blobContainerClient: expect.objectContaining({
            containerName: mocks.config.ACTIVATIONS_CONTAINER_NAME,
          }),
        }),
      );
    });
  });
});
