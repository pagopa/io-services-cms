import { EventHubProducerClient } from "@azure/event-hubs";
import {
  ExponentialBackoffRetryOptions,
  InvocationContext,
  app,
  output,
} from "@azure/functions";
import { DefaultAzureCredential } from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";
import { ApimUtils } from "@io-services-cms/external-clients";
import { Fetch } from "@io-services-cms/fetch-utils";
import {
  Activations,
  LegacyServiceCosmosResource,
  ServiceHistory,
  ServiceLifecycle,
  ServicePublication,
  stores,
} from "@io-services-cms/models";
import {
  SERVICE_COLLECTION_NAME,
  ServiceModel,
} from "@pagopa/io-functions-commons/dist/src/models/service";
import {
  SUBSCRIPTION_CIDRS_COLLECTION_NAME,
  SubscriptionCIDRsModel,
} from "@pagopa/io-functions-commons/dist/src/models/subscription_cidrs";
import { wrapHandlerV4 } from "@pagopa/io-functions-commons/dist/src/utils/azure-functions-v4-express-adapter";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { createBlobService } from "azure-storage";
import * as O from "fp-ts/Option";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as RA from "fp-ts/ReadonlyArray";
import * as RR from "fp-ts/ReadonlyRecord";
import * as B from "fp-ts/boolean";
import { pipe } from "fp-ts/lib/function";
import * as t from "io-ts";
import { Json, JsonFromString } from "io-ts-types";

import { getConfigOrThrow } from "./config";
import { createRequestDeletionHandler } from "./deletor/request-deletion-handler";
import { createRequestDetailHandler } from "./detailRequestor/request-detail-handler";
import { createRequestHistoricizationHandler } from "./historicizer/request-historicization-handler";
import { createRequestServicesHistoryIngestionRetryHandler } from "./ingestion/request-services-history-ingestion-retry-handler";
import { createRequestServicesLifecycleIngestionRetryHandler } from "./ingestion/request-services-lifecycle-ingestion-retry-handler";
import { createRequestServicesPublicationIngestionRetryHandler } from "./ingestion/request-services-publication-ingestion-retry-handler";
import { createServiceTopicIngestorHandler } from "./ingestion/service-topic-ingestor-handler";
import { toAzureFunctionHandler } from "./lib/azure/adapters";
import {
  getAppBackendCosmosDatabase,
  getCmsCosmosDatabase,
} from "./lib/azure/cosmos";
import {
  log,
  processAllOf,
  processBatchOf,
  setBindings,
} from "./lib/azure/misc";
import { jiraClient } from "./lib/clients/jira-client";
import { createRequestPublicationHandler } from "./publicator/request-publication-handler";
import { createRequestReviewHandler } from "./reviewer/request-review-handler";
import { createRequestReviewLegacyHandler } from "./reviewer/request-review-legacy-handler";
import { createReviewCheckerHandler } from "./reviewer/review-checker-handler";
import { createReviewLegacyCheckerHandler } from "./reviewer/review-legacy-checker-handler";
import { createServiceValidationHandler } from "./reviewer/service-validation-handler";
import { createRequestSyncCmsHandler } from "./synchronizer/request-sync-cms-handler";
import { createRequestSyncLegacyHandler } from "./synchronizer/request-sync-legacy-handler";
import { initTelemetryClient } from "./utils/applicationinsight";
import { makeCosmosHelper, makeCosmosPagedHelper } from "./utils/cosmos-helper";
import {
  cosmosdbClient,
  cosmosdbInstance as legacyCosmosDbInstance,
} from "./utils/cosmos-legacy";
import { jiraProxy } from "./utils/jira-proxy";
import { pdvTokenizerClient } from "./utils/pdvTokenizerClient";
import { getDao as getServiceReviewDao } from "./utils/service-review-dao";
import { getDao as getServiceTopicDao } from "./utils/service-topic-dao";
import { GroupChangeEvent } from "./utils/sync-group-utils";
import {
  handler as onIngestionActivationChangeHandler,
  parseBlob,
} from "./watchers/on-activation-ingestion-change";
import { makeHandler as makeOnLegacyActivationChangeHandler } from "./watchers/on-legacy-activations-change";
import { handler as onLegacyServiceChangeHandler } from "./watchers/on-legacy-service-change";
import { makeHandler as makeOnSelfcareGroupChangeHandler } from "./watchers/on-selfcare-group-change";
import { handler as onServiceDetailLifecycleChangeHandler } from "./watchers/on-service-detail-lifecycle-change";
import { handler as onServiceDetailPublicationChangeHandler } from "./watchers/on-service-detail-publication-change";
import { handler as onServiceHistoryHandler } from "./watchers/on-service-history-change";
import { handler as onIngestionServiceHistoryChangeHandler } from "./watchers/on-service-ingestion-history-change";
import { handler as onIngestionServiceLifecycleChangeHandler } from "./watchers/on-service-ingestion-lifecycle-change";
import { handler as onIngestionServicePublicationChangeHandler } from "./watchers/on-service-ingestion-publication-change";
import { handler as onServiceLifecycleChangeHandler } from "./watchers/on-service-lifecycle-change";
import { handler as onServicePublicationChangeHandler } from "./watchers/on-service-publication-change";
import {
  applyRequestMiddelwares as applyCheckServiceDuplicationInternalRequestMiddelwares,
  makeCheckServiceDuplicationInternalHandler,
} from "./webservice/controllers/check-service-duplication-internal";
import {
  applyRequestMiddelwares as applyCreateServiceRequestMiddelwares,
  makeCreateServiceHandler,
} from "./webservice/controllers/create-service";
import {
  applyRequestMiddelwares as applyDeleteServiceRequestMiddelwares,
  makeDeleteServiceHandler,
} from "./webservice/controllers/delete-service";
import {
  applyRequestMiddelwares as applyEditServiceRequestMiddelwares,
  makeEditServiceHandler,
} from "./webservice/controllers/edit-service";
import {
  applyRequestMiddelwares as applyGetServiceHistoryRequestMiddelwares,
  makeGetServiceHistoryHandler,
} from "./webservice/controllers/get-service-history";
import {
  applyRequestMiddelwares as applyGetServiceKeysRequestMiddelwares,
  makeGetServiceKeysHandler,
} from "./webservice/controllers/get-service-keys";
import {
  applyRequestMiddelwares as applyGetServiceLifecycleRequestMiddelwares,
  makeGetServiceLifecycleHandler,
} from "./webservice/controllers/get-service-lifecycle";
import {
  applyRequestMiddelwares as applyGetServiceLifecycleInternalRequestMiddelwares,
  makeGetServiceLifecycleInternalHandler,
} from "./webservice/controllers/get-service-lifecycle-internal";
import {
  applyRequestMiddelwares as applyGetPublicationStatusServiceRequestMiddelwares,
  makeGetServicePublicationHandler,
} from "./webservice/controllers/get-service-publication";
import {
  applyRequestMiddelwares as applyGetPublicationServiceInternalRequestMiddelwares,
  makeGetServicePublicationInternalHandler,
} from "./webservice/controllers/get-service-publication-internal";
import {
  applyRequestMiddelwares as applyGetServiceTopicsRequestMiddelwares,
  makeGetServiceTopicsHandler,
} from "./webservice/controllers/get-service-topics";
import {
  applyRequestMiddelwares as applyGetServicesRequestMiddelwares,
  makeGetServicesHandler,
} from "./webservice/controllers/get-services";
import { makeInfoHandler } from "./webservice/controllers/info";
import {
  applyRequestMiddelwares as applyPatchServiceRequestMiddelwares,
  makePatchServiceHandler,
} from "./webservice/controllers/patch-service";
import {
  applyRequestMiddelwares as applyPublishServiceRequestMiddelwares,
  makePublishServiceHandler,
} from "./webservice/controllers/publish-service";
import {
  applyRequestMiddelwares as applyRegenerateServiceKeysRequestMiddelwares,
  makeRegenerateServiceKeysHandler,
} from "./webservice/controllers/regenerate-service-keys";
import {
  applyRequestMiddelwares as applyReviewServiceRequestMiddelwares,
  makeReviewServiceHandler,
} from "./webservice/controllers/review-service";
import {
  applyRequestMiddelwares as applyUnpublishServiceRequestMiddelwares,
  makeUnpublishServiceHandler,
} from "./webservice/controllers/unpublish-service";
import {
  applyRequestMiddelwares as applyUploadServiceLogoRequestMiddelwares,
  makeUploadServiceLogoHandler,
} from "./webservice/controllers/upload-service-logo";

// the application global configuration
const config = getConfigOrThrow();

// client to interact with Api Management
const apimClient = ApimUtils.getApimClient(config.AZURE_SUBSCRIPTION_ID);

// Apim Service, used to operates on Apim resources
const apimService = ApimUtils.getApimService(
  apimClient,
  config.AZURE_APIM_RESOURCE_GROUP,
  config.AZURE_APIM,
  config.AZURE_APIM_SUBSCRIPTION_PRODUCT_NAME,
);

// client to interact with cms cosmos db
const cmsCosmosDatabase = getCmsCosmosDatabase(config);

// client to interact with app backend cosmos db
const appBackendCosmosDatabase = getAppBackendCosmosDatabase(config);

// create a store for the ServiceLifecycle finite state machine
const serviceLifecycleStore = stores.createCosmosStore(
  cmsCosmosDatabase.container(config.COSMOSDB_CONTAINER_SERVICES_LIFECYCLE),
  ServiceLifecycle.ItemType,
);

// create a store for the ServicePublication finite state machine
const servicePublicationStore = stores.createCosmosStore(
  cmsCosmosDatabase.container(config.COSMOSDB_CONTAINER_SERVICES_PUBLICATION),
  ServicePublication.ItemType,
);

const serviceHistoryPagedHelper = makeCosmosPagedHelper(
  ServiceHistory,
  cmsCosmosDatabase.container(config.COSMOSDB_CONTAINER_SERVICES_HISTORY),
  config.DEFAULT_PAGED_FETCH_LIMIT,
);

const servicePublicationCosmosHelper = makeCosmosHelper(
  cmsCosmosDatabase.container(config.COSMOSDB_CONTAINER_SERVICES_PUBLICATION),
);

const serviceLifecycleCosmosHelper = makeCosmosHelper(
  cmsCosmosDatabase.container(config.COSMOSDB_CONTAINER_SERVICES_LIFECYCLE),
);

const serviceDetailCosmosHelper = makeCosmosHelper(
  appBackendCosmosDatabase.container(
    config.COSMOSDB_CONTAINER_SERVICES_DETAILS,
  ),
);

const subscriptionCIDRsModel = new SubscriptionCIDRsModel(
  legacyCosmosDbInstance.container(SUBSCRIPTION_CIDRS_COLLECTION_NAME),
);

// Get an instance of ServiceLifecycle client
const fsmLifecycleClientCreator = ServiceLifecycle.getFsmClient(
  serviceLifecycleStore,
);

// Get an instance of ServicePublication client
const fsmPublicationClient = ServicePublication.getFsmClient(
  servicePublicationStore,
);

// PDV tokenizer Client
const pdvTokenizer = pdvTokenizerClient(
  config.PDV_TOKENIZER_BASE_URL,
  config.PDV_TOKENIZER_API_KEY,
  Fetch.createRetriableAgentFetch(config),
  config.PDV_TOKENIZER_BASE_PATH,
);

// AppInsights client for Telemetry
const telemetryClient = initTelemetryClient(
  config.APPLICATIONINSIGHTS_CONNECTION_STRING,
);

const legacyServicesContainer = cosmosdbClient
  .database(config.LEGACY_COSMOSDB_NAME)
  .container(SERVICE_COLLECTION_NAME);

const legacyServiceModel = new ServiceModel(legacyServicesContainer);

const blobService = createBlobService(config.ASSET_STORAGE_CONNECTIONSTRING);

// eventhub producer for ServicePublication
const servicePublicationEventHubProducer = new EventHubProducerClient(
  config.SERVICES_PUBLICATION_EVENT_HUB_CONNECTION_STRING,
  config.SERVICES_PUBLICATION_EVENT_HUB_NAME,
);

// eventhub producer for ServiceTopics
const serviceTopicsEventHubProducer = new EventHubProducerClient(
  config.SERVICES_TOPICS_EVENT_HUB_CONNECTION_STRING,
  config.SERVICES_TOPICS_EVENT_HUB_NAME,
);

// eventhub producer for ServiceLifecycle
const serviceLifecycleEventHubProducer = new EventHubProducerClient(
  config.SERVICES_LIFECYCLE_EVENT_HUB_CONNECTION_STRING,
  config.SERVICES_LIFECYCLE_EVENT_HUB_NAME,
);

// eventhub producer for ServiceHistory
const serviceHistoryEventHubProducer = new EventHubProducerClient(
  config.SERVICES_HISTORY_EVENT_HUB_CONNECTION_STRING,
  config.SERVICES_HISTORY_EVENT_HUB_NAME,
);

// eventhub producer for Activations
const activationEventHubProducer = new EventHubProducerClient(
  config.ACTIVATIONS_EVENT_HUB_CONNECTION_STRING,
  config.ACTIVATIONS_EVENT_HUB_NAME,
);

const blobServiceClient = new BlobServiceClient(
  `https://${config.STORAGE_ACCOUNT_NAME}.blob.core.windows.net`,
  new DefaultAzureCredential(),
);

const eventHubRetryPolicy: ExponentialBackoffRetryOptions = {
  maxRetryCount: 3,
  maximumInterval: { minutes: 1 },
  minimumInterval: { seconds: 1 },
  strategy: "exponentialBackoff" as const,
};

const changeFeedFiveSecondsRetryPolicy: ExponentialBackoffRetryOptions = {
  maxRetryCount: 10,
  maximumInterval: { minutes: 1 },
  minimumInterval: { seconds: 5 },
  strategy: "exponentialBackoff" as const,
};

const changeFeedTenSecondsRetryPolicy: ExponentialBackoffRetryOptions = {
  maxRetryCount: 10,
  maximumInterval: { minutes: 1 },
  minimumInterval: { seconds: 10 },
  strategy: "exponentialBackoff" as const,
};

export const createRequestReviewEntryPoint = createRequestReviewHandler(
  getServiceReviewDao(config),
  jiraProxy(jiraClient(config), config),
  apimService,
  fsmLifecycleClientCreator(),
  fsmPublicationClient,
  config,
);

export const onRequestValidationEntryPoint = pipe(
  createServiceValidationHandler({
    config,
    fsmLifecycleClient: fsmLifecycleClientCreator(),
    fsmPublicationClient,
    serviceLifecycleCosmosHelper,
    servicePublicationCosmosHelper,
    telemetryClient,
  }),
  processBatchOf(t.union([t.string.pipe(JsonFromString), Json]), {
    parallel: false,
  }),
  setBindings((results) => ({
    requestReview: pipe(
      results,
      RA.map(RR.lookup("requestReview")),
      RA.filter(O.isSome),
      RA.map((item) => pipe(item.value, JSON.stringify)),
    ),
  })),
  toAzureFunctionHandler,
);

export const createRequestPublicationEntryPoint =
  createRequestPublicationHandler(fsmPublicationClient);

export const createRequestDeletionEntryPoint =
  createRequestDeletionHandler(fsmPublicationClient);

export const onRequestSyncCmsEntryPoint = createRequestSyncCmsHandler(
  fsmLifecycleClientCreator(),
  fsmPublicationClient,
  config,
);

export const onRequestSyncLegacyEntryPoint =
  createRequestSyncLegacyHandler(legacyServiceModel);

export const createRequestHistoricizationEntryPoint =
  createRequestHistoricizationHandler();

export const createRequestDetailEntryPoint = createRequestDetailHandler(
  serviceDetailCosmosHelper,
);

export const serviceReviewCheckerEntryPoint = createReviewCheckerHandler(
  getServiceReviewDao(config),
  jiraProxy(jiraClient(config), config),
  fsmLifecycleClientCreator(),
);

export const createRequestReviewLegacyEntryPoint =
  createRequestReviewLegacyHandler(
    fsmLifecycleClientCreator(),
    getServiceReviewDao({
      ...config,
      REVIEWER_DB_TABLE: `${config.REVIEWER_DB_TABLE}_legacy` as NonEmptyString,
    }),
    config,
  );

export const serviceReviewLegacyCheckerEntryPoint =
  createReviewLegacyCheckerHandler(
    getServiceReviewDao({
      ...config,
      REVIEWER_DB_TABLE: `${config.REVIEWER_DB_TABLE}_legacy` as NonEmptyString,
    }),
    jiraProxy(
      jiraClient({ ...config, JIRA_PROJECT_NAME: "IES" as NonEmptyString }),
      config,
    ),
    fsmLifecycleClientCreator(),
  );

export const onServiceLifecycleChangeEntryPoint = pipe(
  onServiceLifecycleChangeHandler(config),
  RTE.fromReaderEither,
  processBatchOf(ServiceLifecycle.CosmosResource),
  setBindings((results) => ({
    requestDeletion: pipe(
      results,
      RA.map(RR.lookup("requestDeletion")),
      RA.filter(O.isSome),
      RA.map((item) => pipe(item.value, JSON.stringify)),
    ),
    requestHistoricization: pipe(
      results,
      RA.map(RR.lookup("requestHistoricization")),
      RA.filter(O.isSome),
      RA.map((item) => pipe(item.value, JSON.stringify)),
    ),
    requestPublication: pipe(
      results,
      RA.map(RR.lookup("requestPublication")),
      RA.filter(O.isSome),
      RA.map((item) => pipe(item.value, JSON.stringify)),
    ),
    requestReview: pipe(
      results,
      RA.map(RR.lookup("requestReview")),
      RA.filter(O.isSome),
      RA.map((item) => pipe(item.value, JSON.stringify)),
    ),
  })),
  toAzureFunctionHandler,
);

export const onServicePublicationChangeEntryPoint = pipe(
  onServicePublicationChangeHandler,
  processBatchOf(ServicePublication.CosmosResource),
  setBindings((results) => ({
    requestHistoricization: pipe(
      results,
      RA.map(RR.lookup("requestHistoricization")),
      RA.filter(O.isSome),
      RA.map((item) => pipe(item.value, JSON.stringify)),
    ),
  })),
  toAzureFunctionHandler,
);

export const onLegacyServiceChangeEntryPoint = pipe(
  onLegacyServiceChangeHandler(config, apimService, legacyServiceModel),
  processBatchOf(LegacyServiceCosmosResource, { parallel: false }),
  setBindings((results) => ({
    requestSyncCms: pipe(
      results,
      RA.map(RR.lookup("requestSyncCms")),
      RA.filter(O.isSome),
      RA.map((item) => pipe(item.value, JSON.stringify)),
    ),
  })),
  toAzureFunctionHandler,
);

export const onServiceHistoryChangeEntryPoint = pipe(
  onServiceHistoryHandler(config, apimService, fsmPublicationClient),
  processBatchOf(ServiceHistory),
  setBindings((results) => ({
    requestSyncLegacy: pipe(
      results,
      RA.map(RR.lookup("requestSyncLegacy")),
      RA.filter(O.isSome),
      RA.map((item) => pipe(item.value, JSON.stringify)),
    ),
  })),
  toAzureFunctionHandler,
);

export const onServiceDetailPublicationChangeEntryPoint = pipe(
  onServiceDetailPublicationChangeHandler,
  processBatchOf(ServicePublication.CosmosResource),
  setBindings((results) => ({
    requestDetailPublication: pipe(
      results,
      RA.map(RR.lookup("requestDetailPublication")),
      RA.filter(O.isSome),
      RA.map((item) => pipe(item.value, JSON.stringify)),
    ),
  })),
  toAzureFunctionHandler,
);

export const onServiceDetailLifecycleChangeEntryPoint = pipe(
  onServiceDetailLifecycleChangeHandler,
  processBatchOf(ServiceLifecycle.CosmosResource),
  setBindings((results) => ({
    requestDetailLifecycle: pipe(
      results,
      RA.map(RR.lookup("requestDetailLifecycle")),
      RA.filter(O.isSome),
      RA.map((item) => pipe(item.value, JSON.stringify)),
    ),
  })),
  toAzureFunctionHandler,
);

export const onSelfcareGroupChangeEntryPoint = (
  args: unknown,
  context: InvocationContext,
) =>
  pipe(
    { apimService, serviceLifecycleStore },
    makeOnSelfcareGroupChangeHandler,
    processBatchOf(GroupChangeEvent),
    RTE.orElseW((e) =>
      pipe(
        context.retryContext?.maxRetryCount ===
          context.retryContext?.retryCount,
        B.fold(
          () => RTE.left(e),
          () => {
            log(
              context,
              e instanceof Error ? e.message : "Something went wrong",
              "warn",
            );
            context.extraOutputs.set(
              "syncGroupPoisonQueue",
              JSON.stringify(args),
            );
            return RTE.right([]);
          },
        ),
      ),
    ),
    toAzureFunctionHandler,
  )(args, context);

export const activationsSyncFromLegacyEntryPoint = (
  args: unknown,
  context: InvocationContext,
) =>
  pipe(
    {
      blobContainerClient: blobServiceClient.getContainerClient(
        config.ACTIVATIONS_CONTAINER_NAME,
      ),
    },
    makeOnLegacyActivationChangeHandler,
    processBatchOf(Activations.LegacyCosmosResource),
    RTE.orElseW((e) =>
      pipe(
        context.retryContext?.maxRetryCount ===
          context.retryContext?.retryCount,
        B.fold(
          () => RTE.left(e),
          () => {
            log(
              context,
              e instanceof Error
                ? e.message
                : "Something went wrong! Exeeded maxRetryCount, so items will be sent to poison queue",
              "warn",
            );
            context.extraOutputs.set(
              "activationsSyncFromLegacyPoisonQueue",
              JSON.stringify(args),
            );
            return RTE.right([]);
          },
        ),
      ),
    ),
    toAzureFunctionHandler,
  )(args, context);

//Ingestion Service Publication
export const onIngestionServicePublicationChangeEntryPoint = pipe(
  onIngestionServicePublicationChangeHandler(
    servicePublicationEventHubProducer,
  ),
  processAllOf(ServicePublication.CosmosResource),
  setBindings((results) => ({
    ingestionError: pipe(
      results,
      RA.map(RR.lookup("ingestionError")),
      RA.filter(O.isSome),
      RA.map((item) => pipe(item.value, JSON.stringify)),
    ),
  })),
  toAzureFunctionHandler,
);

//Ingestion Service Publication Retry DLQ
export const createRequestServicesPublicationIngestionRetryEntryPoint =
  createRequestServicesPublicationIngestionRetryHandler(
    servicePublicationEventHubProducer,
  );

export const serviceTopicIngestorEntryPoint = createServiceTopicIngestorHandler(
  getServiceTopicDao(config),
  serviceTopicsEventHubProducer,
);

export const onIngestionServiceLifecycleChangeEntryPoint = pipe(
  onIngestionServiceLifecycleChangeHandler(serviceLifecycleEventHubProducer),
  processAllOf(ServiceLifecycle.CosmosResource),
  setBindings((results) => ({
    ingestionError: pipe(
      results,
      RA.map(RR.lookup("ingestionError")),
      RA.filter(O.isSome),
      RA.map((item) => pipe(item.value, JSON.stringify)),
    ),
  })),
  toAzureFunctionHandler,
);

//Ingestion Service History
export const onIngestionServiceHistoryChangeEntryPoint = pipe(
  onIngestionServiceHistoryChangeHandler(serviceHistoryEventHubProducer),
  processAllOf(ServiceHistory),
  setBindings((results) => ({
    ingestionError: pipe(
      results,
      RA.map(RR.lookup("ingestionError")),
      RA.filter(O.isSome),
      RA.map((item) => pipe(item.value, JSON.stringify)),
    ),
  })),
  toAzureFunctionHandler,
);

//Ingestion Activations
export const onIngestionActivationChangeEntryPoint = pipe(
  onIngestionActivationChangeHandler(
    activationEventHubProducer,
    pdvTokenizer,
    config,
  ),
  parseBlob,
  toAzureFunctionHandler,
);

//Ingestion Service Lifecycle Retry DLQ
export const createRequestServicesLifecycleIngestionRetryEntryPoint =
  createRequestServicesLifecycleIngestionRetryHandler(
    serviceLifecycleEventHubProducer,
  );
//Ingestion Service History Retry DLQ
export const createRequestServicesHistoryIngestionRetryEntryPoint =
  createRequestServicesHistoryIngestionRetryHandler(
    serviceHistoryEventHubProducer,
  );

app.http("Info", {
  authLevel: "anonymous",
  handler: wrapHandlerV4([], makeInfoHandler()),
  methods: ["GET"],
  route: "info",
});

app.http("CreateService", {
  authLevel: "anonymous",
  handler: applyCreateServiceRequestMiddelwares(
    config,
    subscriptionCIDRsModel,
  )(
    makeCreateServiceHandler({
      apimService,
      config,
      fsmLifecycleClientCreator,
      telemetryClient,
    }),
  ),
  methods: ["POST"],
  route: "services",
});

app.http("GetServices", {
  authLevel: "anonymous",
  handler: applyGetServicesRequestMiddelwares(
    config,
    subscriptionCIDRsModel,
  )(
    makeGetServicesHandler({
      apimService,
      config,
      fsmLifecycleClientCreator,
      telemetryClient,
    }),
  ),
  methods: ["GET"],
  route: "services",
});

app.http("GetServiceTopics", {
  authLevel: "anonymous",
  handler: applyGetServiceTopicsRequestMiddelwares(
    makeGetServiceTopicsHandler({
      serviceTopicDao: getServiceTopicDao(config),
    }),
  ),
  methods: ["GET"],
  route: "services/topics",
});

app.http("CheckServiceDuplicationInternal", {
  authLevel: "anonymous",
  handler: applyCheckServiceDuplicationInternalRequestMiddelwares(
    makeCheckServiceDuplicationInternalHandler({
      serviceLifecycleCosmosHelper,
      servicePublicationCosmosHelper,
      telemetryClient,
    }),
  ),
  methods: ["GET"],
  route: "internal/services/duplicates",
});

app.http("GetServiceLifecycleInternal", {
  authLevel: "anonymous",
  handler: applyGetServiceLifecycleInternalRequestMiddelwares(
    makeGetServiceLifecycleInternalHandler({
      apimService,
      config,
      fsmLifecycleClient: fsmLifecycleClientCreator(),
      telemetryClient,
    }),
  ),
  methods: ["GET"],
  route: "internal/services/{serviceId}",
});

app.http("GetServiceLifecycle", {
  authLevel: "anonymous",
  handler: applyGetServiceLifecycleRequestMiddelwares(
    config,
    subscriptionCIDRsModel,
  )(
    makeGetServiceLifecycleHandler({
      apimService,
      config,
      fsmLifecycleClientCreator,
      telemetryClient,
    }),
  ),
  methods: ["GET"],
  route: "services/{serviceId}",
});

app.http("EditService", {
  authLevel: "anonymous",
  handler: applyEditServiceRequestMiddelwares(
    config,
    subscriptionCIDRsModel,
  )(
    makeEditServiceHandler({
      apimService,
      config,
      fsmLifecycleClientCreator,
      telemetryClient,
    }),
  ),
  methods: ["PUT"],
  route: "services/{serviceId}",
});

app.http("PatchService", {
  authLevel: "anonymous",
  handler: applyPatchServiceRequestMiddelwares(config)(
    makePatchServiceHandler({
      apimService,
      fsmLifecycleClientCreator,
      telemetryClient,
    }),
  ),
  methods: ["PATCH"],
  route: "services/{serviceId}",
});

app.http("DeleteService", {
  authLevel: "anonymous",
  handler: applyDeleteServiceRequestMiddelwares(
    config,
    subscriptionCIDRsModel,
  )(
    makeDeleteServiceHandler({
      apimService,
      fsmLifecycleClientCreator,
      telemetryClient,
    }),
  ),
  methods: ["DELETE"],
  route: "services/{serviceId}",
});

app.http("GetServiceHistory", {
  authLevel: "anonymous",
  handler: applyGetServiceHistoryRequestMiddelwares(
    config,
    subscriptionCIDRsModel,
  )(
    makeGetServiceHistoryHandler({
      apimService,
      config,
      fsmLifecycleClientCreator,
      serviceHistoryPagedHelper,
      telemetryClient,
    }),
  ),
  methods: ["GET"],
  route: "services/{serviceId}/history",
});

app.http("ReviewService", {
  authLevel: "anonymous",
  handler: applyReviewServiceRequestMiddelwares(
    config,
    subscriptionCIDRsModel,
  )(
    makeReviewServiceHandler({
      apimService,
      fsmLifecycleClientCreator,
      telemetryClient,
    }),
  ),
  methods: ["PUT"],
  route: "services/{serviceId}/review",
});

app.http("PublishService", {
  authLevel: "anonymous",
  handler: applyPublishServiceRequestMiddelwares(
    config,
    subscriptionCIDRsModel,
  )(
    makePublishServiceHandler({
      apimService,
      fsmLifecycleClientCreator,
      fsmPublicationClient,
      telemetryClient,
    }),
  ),
  methods: ["POST"],
  route: "services/{serviceId}/release",
});

app.http("GetServicePublication", {
  authLevel: "anonymous",
  handler: applyGetPublicationStatusServiceRequestMiddelwares(
    config,
    subscriptionCIDRsModel,
  )(
    makeGetServicePublicationHandler({
      apimService,
      config,
      fsmLifecycleClientCreator,
      fsmPublicationClient,
      telemetryClient,
    }),
  ),
  methods: ["GET"],
  route: "services/{serviceId}/release",
});

app.http("GetServicePublicationInternal", {
  authLevel: "anonymous",
  handler: applyGetPublicationServiceInternalRequestMiddelwares(
    makeGetServicePublicationInternalHandler({
      apimService,
      config,
      fsmPublicationClient,
      telemetryClient,
    }),
  ),
  methods: ["GET"],
  route: "internal/services/{serviceId}/release",
});

app.http("UnpublishService", {
  authLevel: "anonymous",
  handler: applyUnpublishServiceRequestMiddelwares(
    config,
    subscriptionCIDRsModel,
  )(
    makeUnpublishServiceHandler({
      apimService,
      fsmLifecycleClientCreator,
      fsmPublicationClient,
      telemetryClient,
    }),
  ),
  methods: ["DELETE"],
  route: "services/{serviceId}/release",
});

app.http("GetServiceKeys", {
  authLevel: "anonymous",
  handler: applyGetServiceKeysRequestMiddelwares(
    config,
    subscriptionCIDRsModel,
  )(
    makeGetServiceKeysHandler({
      apimService,
      fsmLifecycleClientCreator,
      telemetryClient,
    }),
  ),
  methods: ["GET"],
  route: "services/{serviceId}/keys",
});

app.http("RegenerateServiceKeys", {
  authLevel: "anonymous",
  handler: applyRegenerateServiceKeysRequestMiddelwares(
    config,
    subscriptionCIDRsModel,
  )(
    makeRegenerateServiceKeysHandler({
      apimService,
      fsmLifecycleClientCreator,
      telemetryClient,
    }),
  ),
  methods: ["PUT"],
  route: "services/{serviceId}/keys/{keyType}",
});

app.http("UploadServiceLogo", {
  authLevel: "anonymous",
  handler: applyUploadServiceLogoRequestMiddelwares(
    config,
    subscriptionCIDRsModel,
  )(
    makeUploadServiceLogoHandler({
      apimService,
      blobService,
      fsmLifecycleClientCreator,
      telemetryClient,
    }),
  ),
  methods: ["PUT"],
  route: "services/{serviceId}/logo",
});

app.storageQueue("OnRequestReview", {
  connection: "INTERNAL_STORAGE_CONNECTION_STRING",
  handler: createRequestReviewEntryPoint,
  queueName: "%REQUEST_REVIEW_QUEUE%",
});

app.storageQueue("OnRequestPublication", {
  connection: "INTERNAL_STORAGE_CONNECTION_STRING",
  handler: createRequestPublicationEntryPoint,
  queueName: "%REQUEST_PUBLICATION_QUEUE%",
});

app.storageQueue("OnRequestDeletion", {
  connection: "INTERNAL_STORAGE_CONNECTION_STRING",
  handler: createRequestDeletionEntryPoint,
  queueName: "%REQUEST_DELETION_QUEUE%",
});

app.storageQueue("OnRequestSyncCms", {
  connection: "INTERNAL_STORAGE_CONNECTION_STRING",
  handler: onRequestSyncCmsEntryPoint,
  queueName: "%REQUEST_SYNC_CMS_QUEUE%",
});

app.storageQueue("OnRequestSyncLegacy", {
  connection: "INTERNAL_STORAGE_CONNECTION_STRING",
  handler: onRequestSyncLegacyEntryPoint,
  queueName: "%REQUEST_SYNC_LEGACY_QUEUE%",
});

app.storageQueue("OnRequestHistoricization", {
  connection: "INTERNAL_STORAGE_CONNECTION_STRING",
  extraOutputs: [
    output.generic({
      connection: "COSMOSDB_CONNECTIONSTRING",
      containerName: "%COSMOSDB_CONTAINER_SERVICES_HISTORY%",
      createIfNotExists: false,
      databaseName: "%COSMOSDB_NAME%",
      name: "serviceHistoryDocument",
      type: "cosmosDB",
    }),
  ],
  handler: createRequestHistoricizationEntryPoint,
  queueName: "%REQUEST_HISTORICIZATION_QUEUE%",
});

app.storageQueue("OnRequestDetail", {
  connection: "INTERNAL_STORAGE_CONNECTION_STRING",
  extraOutputs: [
    output.generic({
      connection: "COSMOSDB_CONNECTIONSTRING",
      containerName: "%COSMOSDB_CONTAINER_SERVICES_DETAILS%",
      createIfNotExists: false,
      databaseName: "%COSMOSDB_APP_BE_NAME%",
      name: "serviceDetailDocument",
      type: "cosmosDB",
    }),
  ],
  handler: createRequestDetailEntryPoint,
  queueName: "%REQUEST_DETAIL_QUEUE%",
});

app.storageQueue("OnRequestReviewLegacy", {
  connection: "INTERNAL_STORAGE_CONNECTION_STRING",
  handler: createRequestReviewLegacyEntryPoint,
  queueName: "%REQUEST_REVIEW_LEGACY_QUEUE%",
});

app.storageQueue("OnRequestValidation", {
  connection: "INTERNAL_STORAGE_CONNECTION_STRING",
  extraOutputs: [
    output.generic({
      connection: "INTERNAL_STORAGE_CONNECTION_STRING",
      name: "requestReview",
      queueName: "%REQUEST_REVIEW_QUEUE%",
      type: "queue",
    }),
  ],
  handler: onRequestValidationEntryPoint,
  queueName: "%REQUEST_VALIDATION_QUEUE%",
});

app.storageQueue("OnRequestServicesPublicationIngestionRetry", {
  connection: "INTERNAL_STORAGE_CONNECTION_STRING",
  handler: createRequestServicesPublicationIngestionRetryEntryPoint,
  queueName: "%REQUEST_SERVICES_PUBLICATION_INGESTION_RETRY_QUEUE%",
});

app.storageQueue("OnRequestServicesLifecycleIngestionRetry", {
  connection: "INTERNAL_STORAGE_CONNECTION_STRING",
  handler: createRequestServicesLifecycleIngestionRetryEntryPoint,
  queueName: "%REQUEST_SERVICES_LIFECYCLE_INGESTION_RETRY_QUEUE%",
});

app.storageQueue("OnRequestServicesHistoryIngestionRetry", {
  connection: "INTERNAL_STORAGE_CONNECTION_STRING",
  handler: createRequestServicesHistoryIngestionRetryEntryPoint,
  queueName: "%REQUEST_SERVICES_HISTORY_INGESTION_RETRY_QUEUE%",
});

app.cosmosDB("ServiceLifecycleWatcher", {
  connection: "COSMOSDB_CONNECTIONSTRING",
  containerName: "%COSMOSDB_CONTAINER_SERVICES_LIFECYCLE%",
  createLeaseContainerIfNotExists: true,
  databaseName: "%COSMOSDB_NAME%",
  extraOutputs: [
    output.generic({
      connection: "INTERNAL_STORAGE_CONNECTION_STRING",
      name: "requestDeletion",
      queueName: "%REQUEST_DELETION_QUEUE%",
      type: "queue",
    }),
    output.generic({
      connection: "INTERNAL_STORAGE_CONNECTION_STRING",
      name: "requestReview",
      queueName: "%REQUEST_VALIDATION_QUEUE%",
      type: "queue",
    }),
    output.generic({
      connection: "INTERNAL_STORAGE_CONNECTION_STRING",
      name: "requestPublication",
      queueName: "%REQUEST_PUBLICATION_QUEUE%",
      type: "queue",
    }),
    output.generic({
      connection: "INTERNAL_STORAGE_CONNECTION_STRING",
      name: "requestHistoricization",
      queueName: "%REQUEST_HISTORICIZATION_QUEUE%",
      type: "queue",
    }),
  ],
  handler: onServiceLifecycleChangeEntryPoint,
  leaseContainerName: "%COSMOSDB_CONTAINER_SERVICES_LIFECYCLE%-lease",
  maxItemsPerInvocation: 30,
  retry: changeFeedFiveSecondsRetryPolicy,
  startFromBeginning: true,
});

app.cosmosDB("ServicePublicationWatcher", {
  connection: "COSMOSDB_CONNECTIONSTRING",
  containerName: "%COSMOSDB_CONTAINER_SERVICES_PUBLICATION%",
  createLeaseContainerIfNotExists: true,
  databaseName: "%COSMOSDB_NAME%",
  extraOutputs: [
    output.generic({
      connection: "INTERNAL_STORAGE_CONNECTION_STRING",
      name: "requestHistoricization",
      queueName: "%REQUEST_HISTORICIZATION_QUEUE%",
      type: "queue",
    }),
  ],
  handler: onServicePublicationChangeEntryPoint,
  leaseContainerName: "%COSMOSDB_CONTAINER_SERVICES_PUBLICATION%-lease",
  maxItemsPerInvocation: 30,
  retry: changeFeedFiveSecondsRetryPolicy,
  startFromBeginning: true,
});

app.cosmosDB("LegacyServiceWatcher", {
  connection: "LEGACY_COSMOSDB_CONNECTIONSTRING",
  containerName: "%LEGACY_COSMOSDB_CONTAINER_SERVICES%",
  createLeaseContainerIfNotExists: true,
  databaseName: "%LEGACY_COSMOSDB_NAME%",
  extraOutputs: [
    output.generic({
      connection: "INTERNAL_STORAGE_CONNECTION_STRING",
      name: "requestSyncCms",
      queueName: "%REQUEST_SYNC_CMS_QUEUE%",
      type: "queue",
    }),
  ],
  handler: onLegacyServiceChangeEntryPoint,
  leaseContainerName: "%LEGACY_COSMOSDB_CONTAINER_SERVICES_LEASE%",
  maxItemsPerInvocation: 10,
  retry: changeFeedTenSecondsRetryPolicy,
  startFromBeginning: true,
});

app.cosmosDB("ServiceHistoryWatcher", {
  connection: "COSMOSDB_CONNECTIONSTRING",
  containerName: "%COSMOSDB_CONTAINER_SERVICES_HISTORY%",
  createLeaseContainerIfNotExists: true,
  databaseName: "%COSMOSDB_NAME%",
  extraOutputs: [
    output.generic({
      connection: "INTERNAL_STORAGE_CONNECTION_STRING",
      name: "requestSyncLegacy",
      queueName: "%REQUEST_SYNC_LEGACY_QUEUE%",
      type: "queue",
    }),
  ],
  handler: onServiceHistoryChangeEntryPoint,
  leaseContainerName: "%COSMOSDB_CONTAINER_SERVICES_HISTORY%-lease",
  maxItemsPerInvocation: 30,
  retry: changeFeedFiveSecondsRetryPolicy,
  startFromBeginning: true,
});

app.cosmosDB("ServiceDetailPublicationWatcher", {
  connection: "COSMOSDB_CONNECTIONSTRING",
  containerName: "%COSMOSDB_CONTAINER_SERVICES_PUBLICATION%",
  createLeaseContainerIfNotExists: true,
  databaseName: "%COSMOSDB_NAME%",
  extraOutputs: [
    output.generic({
      connection: "INTERNAL_STORAGE_CONNECTION_STRING",
      name: "requestDetailPublication",
      queueName: "%REQUEST_DETAIL_QUEUE%",
      type: "queue",
    }),
  ],
  handler: onServiceDetailPublicationChangeEntryPoint,
  leaseContainerName: "%COSMOSDB_CONTAINER_SERVICES_PUBLICATION%-details-lease",
  maxItemsPerInvocation: 30,
  retry: changeFeedFiveSecondsRetryPolicy,
  startFromBeginning: true,
});

app.cosmosDB("ServiceDetailLifecycleWatcher", {
  connection: "COSMOSDB_CONNECTIONSTRING",
  containerName: "%COSMOSDB_CONTAINER_SERVICES_LIFECYCLE%",
  createLeaseContainerIfNotExists: true,
  databaseName: "%COSMOSDB_NAME%",
  extraOutputs: [
    output.generic({
      connection: "INTERNAL_STORAGE_CONNECTION_STRING",
      name: "requestDetailLifecycle",
      queueName: "%REQUEST_DETAIL_QUEUE%",
      type: "queue",
    }),
  ],
  handler: onServiceDetailLifecycleChangeEntryPoint,
  leaseContainerName: "%COSMOSDB_CONTAINER_SERVICES_LIFECYCLE%-details-lease",
  maxItemsPerInvocation: 30,
  retry: changeFeedFiveSecondsRetryPolicy,
  startFromBeginning: true,
});

app.eventHub("SelfcareGroupWatcher", {
  cardinality: "one",
  connection: "EH_SC_CONNECTIONSTRING",
  consumerGroup: "%EH_SC_USERGROUP_CONSUMER_GROUP%",
  eventHubName: "%EH_SC_USERGROUP_NAME%",
  extraOutputs: [
    output.generic({
      connection: "INTERNAL_STORAGE_CONNECTION_STRING",
      name: "syncGroupPoisonQueue",
      queueName: "%SYNC_GROUP_POISON_QUEUE%",
      type: "queue",
    }),
  ],
  handler: onSelfcareGroupChangeEntryPoint,
  retry: eventHubRetryPolicy,
});

app.cosmosDB("ActivationsSyncFromLegacy", {
  connection: "LEGACY_COSMOSDB_CONNECTIONSTRING",
  containerName: "%LEGACY_COSMOSDB_CONTAINER_ACTIVATIONS%",
  createLeaseContainerIfNotExists: true,
  databaseName: "%LEGACY_COSMOSDB_NAME%",
  extraOutputs: [
    output.generic({
      connection: "INTERNAL_STORAGE_CONNECTION_STRING",
      name: "activationsSyncFromLegacyPoisonQueue",
      queueName: "%SYNC_ACTIVATIONS_FROM_LEGACY_POISON_QUEUE%",
      type: "queue",
    }),
  ],
  handler: activationsSyncFromLegacyEntryPoint,
  leaseContainerName: "%LEGACY_COSMOSDB_CONTAINER_ACTIVATIONS_LEASE%",
  maxItemsPerInvocation: 50,
  retry: changeFeedTenSecondsRetryPolicy,
  startFromBeginning: true,
});

app.cosmosDB("IngestionServicePublicationWatcher", {
  connection: "COSMOSDB_CONNECTIONSTRING",
  containerName: "%COSMOSDB_CONTAINER_SERVICES_PUBLICATION%",
  createLeaseContainerIfNotExists: true,
  databaseName: "%COSMOSDB_NAME%",
  extraOutputs: [
    output.generic({
      connection: "INTERNAL_STORAGE_CONNECTION_STRING",
      name: "ingestionError",
      queueName: "%REQUEST_SERVICES_PUBLICATION_INGESTION_RETRY_QUEUE%",
      type: "queue",
    }),
  ],
  handler: onIngestionServicePublicationChangeEntryPoint,
  leaseContainerName:
    "%COSMOSDB_CONTAINER_SERVICES_PUBLICATION%-ingestion-lease",
  maxItemsPerInvocation: 30,
  startFromBeginning: true,
});

app.cosmosDB("IngestionServiceLifecycleWatcher", {
  connection: "COSMOSDB_CONNECTIONSTRING",
  containerName: "%COSMOSDB_CONTAINER_SERVICES_LIFECYCLE%",
  createLeaseContainerIfNotExists: true,
  databaseName: "%COSMOSDB_NAME%",
  extraOutputs: [
    output.generic({
      connection: "INTERNAL_STORAGE_CONNECTION_STRING",
      name: "ingestionError",
      queueName: "%REQUEST_SERVICES_LIFECYCLE_INGESTION_RETRY_QUEUE%",
      type: "queue",
    }),
  ],
  handler: onIngestionServiceLifecycleChangeEntryPoint,
  leaseContainerName: "%COSMOSDB_CONTAINER_SERVICES_LIFECYCLE%-ingestion-lease",
  maxItemsPerInvocation: 30,
  startFromBeginning: true,
});

app.cosmosDB("IngestionServiceHistoryWatcher", {
  connection: "COSMOSDB_CONNECTIONSTRING",
  containerName: "%COSMOSDB_CONTAINER_SERVICES_HISTORY%",
  createLeaseContainerIfNotExists: true,
  databaseName: "%COSMOSDB_NAME%",
  extraOutputs: [
    output.generic({
      connection: "INTERNAL_STORAGE_CONNECTION_STRING",
      name: "ingestionError",
      queueName: "%REQUEST_SERVICES_HISTORY_INGESTION_RETRY_QUEUE%",
      type: "queue",
    }),
  ],
  handler: onIngestionServiceHistoryChangeEntryPoint,
  leaseContainerName: "%COSMOSDB_CONTAINER_SERVICES_HISTORY%-ingestion-lease",
  maxItemsPerInvocation: 30,
  startFromBeginning: false,
});

app.storageBlob("IngestionActivationWatcher", {
  connection: "INTERNAL_STORAGE_CONNECTION_STRING",
  handler: onIngestionActivationChangeEntryPoint,
  path: "%ACTIVATIONS_CONTAINER_NAME%/{name}",
});

app.timer("ServiceReviewChecker", {
  handler: (_timer, context) => serviceReviewCheckerEntryPoint(context),
  schedule: "0 8-19 * * 1-5",
});

app.timer("ServiceReviewLegacyChecker", {
  handler: (_timer, context) => serviceReviewLegacyCheckerEntryPoint(context),
  schedule: "0 8-19 * * 1-5",
});

app.timer("ServiceTopicsIngestor", {
  handler: (_timer, context) => serviceTopicIngestorEntryPoint(context),
  schedule: "0 0 9 * * 2",
});
