import { ApimUtils } from "@io-services-cms/external-clients";
import {
  LegacyService,
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
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { createBlobService } from "azure-storage";
import * as O from "fp-ts/Option";
import * as RA from "fp-ts/ReadonlyArray";
import * as RR from "fp-ts/ReadonlyRecord";
import * as RTE from "fp-ts/ReaderTaskEither";
import { pipe } from "fp-ts/lib/function";
import * as t from "io-ts";
import { Json, JsonFromString } from "io-ts-types";
import { getConfigOrThrow } from "./config";
import { createRequestHistoricizationHandler } from "./historicizer/request-historicization-handler";
import {
  expressToAzureFunction,
  toAzureFunctionHandler,
} from "./lib/azure/adapters";
import {
  getAppBackendCosmosDatabase,
  getCmsCosmosDatabase,
} from "./lib/azure/cosmos";
import { processBatchOf, setBindings } from "./lib/azure/misc";
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
import { getDao as getServiceReviewDao } from "./utils/service-review-dao";
import { getDao as getServiceTopicDao } from "./utils/service-topic-dao";
import { handler as onLegacyServiceChangeHandler } from "./watchers/on-legacy-service-change";
import { handler as onServiceHistoryHandler } from "./watchers/on-service-history-change";
import {
  handler as onServiceLifecycleChangeHandler,
  ServiceLifecycleCosmosResource,
} from "./watchers/on-service-lifecycle-change";
import { handler as onServicePublicationChangeHandler } from "./watchers/on-service-publication-change";
import { handler as onServiceDetailPublicationChangeHandler } from "./watchers/on-service-detail-publication-change";
import { handler as onServiceDetailLifecycleChangeHandler } from "./watchers/on-service-detail-lifecycle-change";
import { createWebServer } from "./webservice";
import { createRequestDeletionHandler } from "./deletor/request-deletion-handler";
import { createRequestDetailHandler } from "./detailRequestor/request-detail-handler";

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unused-vars
const BASE_PATH = require("../host.json").extensions.http.routePrefix;

// the application global configuration
const config = getConfigOrThrow();

// client to interact with Api Management
const apimClient = ApimUtils.getApimClient(
  config,
  config.AZURE_SUBSCRIPTION_ID
);

// Apim Service, used to operates on Apim resources
const apimService = ApimUtils.getApimService(
  apimClient,
  config.AZURE_APIM_RESOURCE_GROUP,
  config.AZURE_APIM
);

// client to interact with cms cosmos db
const cmsCosmosDatabase = getCmsCosmosDatabase(config);

// client to interact with app backend cosmos db
const appBackendCosmosDatabase = getAppBackendCosmosDatabase(config);

// create a store for the ServiceLifecycle finite state machine
const serviceLifecycleStore = stores.createCosmosStore(
  cmsCosmosDatabase.container(config.COSMOSDB_CONTAINER_SERVICES_LIFECYCLE),
  ServiceLifecycle.ItemType
);

// create a store for the ServicePublication finite state machine
const servicePublicationStore = stores.createCosmosStore(
  cmsCosmosDatabase.container(config.COSMOSDB_CONTAINER_SERVICES_PUBLICATION),
  ServicePublication.ItemType
);

const serviceHistoryPagedHelper = makeCosmosPagedHelper(
  ServiceHistory,
  cmsCosmosDatabase.container(config.COSMOSDB_CONTAINER_SERVICES_HISTORY),
  config.DEFAULT_PAGED_FETCH_LIMIT
);

const servicePublicationCosmosHelper = makeCosmosHelper(
  cmsCosmosDatabase.container(config.COSMOSDB_CONTAINER_SERVICES_PUBLICATION)
);

const serviceLifecycleCosmosHelper = makeCosmosHelper(
  cmsCosmosDatabase.container(config.COSMOSDB_CONTAINER_SERVICES_LIFECYCLE)
);

const serviceDetailCosmosHelper = makeCosmosHelper(
  appBackendCosmosDatabase.container(config.COSMOSDB_CONTAINER_SERVICES_DETAILS)
);

const subscriptionCIDRsModel = new SubscriptionCIDRsModel(
  legacyCosmosDbInstance.container(SUBSCRIPTION_CIDRS_COLLECTION_NAME)
);

// Get an instance of ServiceLifecycle client
const fsmLifecycleClient = ServiceLifecycle.getFsmClient(serviceLifecycleStore);

// Get an instance of ServicePublication client
const fsmPublicationClient = ServicePublication.getFsmClient(
  servicePublicationStore
);

// AppInsights client for Telemetry
const telemetryClient = initTelemetryClient(
  config.APPINSIGHTS_INSTRUMENTATIONKEY
);

const legacyServicesContainer = cosmosdbClient
  .database(config.LEGACY_COSMOSDB_NAME)
  .container(SERVICE_COLLECTION_NAME);

const legacyServiceModel = new ServiceModel(legacyServicesContainer);

const blobService = createBlobService(config.ASSET_STORAGE_CONNECTIONSTRING);

// entrypoint for all http functions
export const httpEntryPoint = pipe(
  {
    basePath: BASE_PATH,
    apimService,
    config,
    fsmLifecycleClient,
    fsmPublicationClient,
    subscriptionCIDRsModel,
    telemetryClient,
    blobService,
    serviceTopicDao: getServiceTopicDao(config),
    serviceHistoryPagedHelper,
    servicePublicationCosmosHelper,
    serviceLifecycleCosmosHelper,
  },
  createWebServer,
  expressToAzureFunction
);

export const createRequestReviewEntryPoint = createRequestReviewHandler(
  getServiceReviewDao(config),
  jiraProxy(jiraClient(config), config),
  apimService,
  fsmLifecycleClient,
  fsmPublicationClient,
  config
);

export const onRequestValidationEntryPoint = pipe(
  createServiceValidationHandler({
    config,
    fsmLifecycleClient,
    fsmPublicationClient,
    telemetryClient,
    servicePublicationCosmosHelper,
    serviceLifecycleCosmosHelper,
  }),
  processBatchOf(t.union([t.string.pipe(JsonFromString), Json]), {
    parallel: false,
  }),
  setBindings((results) => ({
    requestReview: pipe(
      results,
      RA.map(RR.lookup("requestReview")),
      RA.filter(O.isSome),
      RA.map((item) => pipe(item.value, JSON.stringify))
    ),
  })),
  toAzureFunctionHandler
);

export const createRequestPublicationEntryPoint =
  createRequestPublicationHandler(fsmPublicationClient);

export const createRequestDeletionEntryPoint =
  createRequestDeletionHandler(fsmPublicationClient);

export const onRequestSyncCmsEntryPoint = createRequestSyncCmsHandler(
  fsmLifecycleClient,
  fsmPublicationClient,
  config
);

export const onRequestSyncLegacyEntryPoint =
  createRequestSyncLegacyHandler(legacyServiceModel);

export const createRequestHistoricizationEntryPoint =
  createRequestHistoricizationHandler();

export const createRequestDetailEntryPoint = createRequestDetailHandler(
  serviceDetailCosmosHelper
);

export const serviceReviewCheckerEntryPoint = createReviewCheckerHandler(
  getServiceReviewDao(config),
  jiraProxy(jiraClient(config), config),
  fsmLifecycleClient
);

export const createRequestReviewLegacyEntryPoint =
  createRequestReviewLegacyHandler(
    fsmLifecycleClient,
    getServiceReviewDao({
      ...config,
      REVIEWER_DB_TABLE: `${config.REVIEWER_DB_TABLE}_legacy` as NonEmptyString,
    }),
    config
  );

export const serviceReviewLegacyCheckerEntryPoint =
  createReviewLegacyCheckerHandler(
    getServiceReviewDao({
      ...config,
      REVIEWER_DB_TABLE: `${config.REVIEWER_DB_TABLE}_legacy` as NonEmptyString,
    }),
    jiraProxy(
      jiraClient({ ...config, JIRA_PROJECT_NAME: "IES" as NonEmptyString }),
      config
    ),
    fsmLifecycleClient
  );

export const onServiceLifecycleChangeEntryPoint = pipe(
  onServiceLifecycleChangeHandler(config),
  RTE.fromReaderEither,
  processBatchOf(ServiceLifecycleCosmosResource),
  setBindings((results) => ({
    requestDeletion: pipe(
      results,
      RA.map(RR.lookup("requestDeletion")),
      RA.filter(O.isSome),
      RA.map((item) => pipe(item.value, JSON.stringify))
    ),
    requestReview: pipe(
      results,
      RA.map(RR.lookup("requestReview")),
      RA.filter(O.isSome),
      RA.map((item) => pipe(item.value, JSON.stringify))
    ),
    requestPublication: pipe(
      results,
      RA.map(RR.lookup("requestPublication")),
      RA.filter(O.isSome),
      RA.map((item) => pipe(item.value, JSON.stringify))
    ),
    requestHistoricization: pipe(
      results,
      RA.map(RR.lookup("requestHistoricization")),
      RA.filter(O.isSome),
      RA.map((item) => pipe(item.value, JSON.stringify))
    ),
  })),
  toAzureFunctionHandler
);

export const onServicePublicationChangeEntryPoint = pipe(
  onServicePublicationChangeHandler,
  processBatchOf(ServicePublication.ItemType),
  setBindings((results) => ({
    requestHistoricization: pipe(
      results,
      RA.map(RR.lookup("requestHistoricization")),
      RA.filter(O.isSome),
      RA.map((item) => pipe(item.value, JSON.stringify))
    ),
  })),
  toAzureFunctionHandler
);

export const onLegacyServiceChangeEntryPoint = pipe(
  onLegacyServiceChangeHandler(config, apimService, legacyServiceModel),
  processBatchOf(LegacyService, { parallel: false }),
  setBindings((results) => ({
    requestSyncCms: pipe(
      results,
      RA.map(RR.lookup("requestSyncCms")),
      RA.filter(O.isSome),
      RA.map((item) => pipe(item.value, JSON.stringify))
    ),
  })),
  toAzureFunctionHandler
);

export const onServiceHistoryChangeEntryPoint = pipe(
  onServiceHistoryHandler(config, apimService, fsmPublicationClient),
  processBatchOf(ServiceHistory),
  setBindings((results) => ({
    requestSyncLegacy: pipe(
      results,
      RA.map(RR.lookup("requestSyncLegacy")),
      RA.filter(O.isSome),
      RA.map((item) => pipe(item.value, JSON.stringify))
    ),
  })),
  toAzureFunctionHandler
);

export const onServiceDetailPublicationChangeEntryPoint = pipe(
  onServiceDetailPublicationChangeHandler,
  processBatchOf(ServicePublication.ItemTypeWithTimestamp),
  setBindings((results) => ({
    requestDetailPublication: pipe(
      results,
      RA.map(RR.lookup("requestDetailPublication")),
      RA.filter(O.isSome),
      RA.map((item) => pipe(item.value, JSON.stringify))
    ),
  })),
  toAzureFunctionHandler
);

export const onServiceDetailLifecycleChangeEntryPoint = pipe(
  onServiceDetailLifecycleChangeHandler,
  processBatchOf(ServiceLifecycle.ItemTypeWithTimestamp),
  setBindings((results) => ({
    requestDetailLifecycle: pipe(
      results,
      RA.map(RR.lookup("requestDetailLifecycle")),
      RA.filter(O.isSome),
      RA.map((item) => pipe(item.value, JSON.stringify))
    ),
  })),
  toAzureFunctionHandler
);
