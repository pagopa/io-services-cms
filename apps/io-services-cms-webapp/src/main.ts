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
import * as O from "fp-ts/Option";
import * as RA from "fp-ts/ReadonlyArray";
import * as RR from "fp-ts/ReadonlyRecord";
import { pipe } from "fp-ts/lib/function";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { getConfigOrThrow } from "./config";
import { createRequestHistoricizationHandler } from "./historicizer/request-historicization-handler";
import {
  expressToAzureFunction,
  toAzureFunctionHandler,
} from "./lib/azure/adapters";
import { getDatabase } from "./lib/azure/cosmos";
import { processBatchOf, setBindings } from "./lib/azure/misc";
import { getApimClient } from "./lib/clients/apim-client";
import { jiraClient } from "./lib/clients/jira-client";
import { jiraLegacyClient } from "./lib/clients/jira-legacy-client";
import { createRequestPublicationHandler } from "./publicator/request-publication-handler";
import { createRequestReviewHandler } from "./reviewer/request-review-handler";
import { createReviewCheckerHandler } from "./reviewer/review-checker-handler";
import { createRequestSyncCmsHandler } from "./synchronizer/request-sync-cms-handler";
import { createRequestSyncLegacyHandler } from "./synchronizer/request-sync-legacy-handler";
import { apimProxy } from "./utils/apim-proxy";
import {
  cosmosdbClient,
  cosmosdbInstance as legacyCosmosDbInstance,
} from "./utils/cosmos-legacy";
import { jiraProxy } from "./utils/jira-proxy";
import { getDao } from "./utils/service-review-dao";
import { handler as onLegacyServiceChangeHandler } from "./watchers/on-legacy-service-change";
import { handler as onServiceHistoryHandler } from "./watchers/on-service-history-change";
import { handler as onServiceLifecycleChangeHandler } from "./watchers/on-service-lifecycle-change";
import { handler as onServicePublicationChangeHandler } from "./watchers/on-service-publication-change";
import { createWebServer } from "./webservice";

import { createRequestReviewLegacyHandler } from "./reviewer/request-review-legacy-handler";
import { initTelemetryClient } from "./utils/applicationinsight";
import { createReviewLegacyCheckerHandler } from "./reviewer/review-legacy-checker-handler";

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unused-vars
const BASE_PATH = require("../host.json").extensions.http.routePrefix;

// the application global configuration
const config = getConfigOrThrow();

// client to interact with Api Management
const apimClient = getApimClient(config, config.AZURE_SUBSCRIPTION_ID);

// client to interact with cms db
const cosmos = getDatabase(config);

// create a store for the ServiceLifecycle finite state machine
const serviceLifecycleStore = stores.createCosmosStore(
  cosmos.container(config.COSMOSDB_CONTAINER_SERVICES_LIFECYCLE),
  ServiceLifecycle.ItemType
);

// create a store for the ServicePublication finite state machine
const servicePublicationStore = stores.createCosmosStore(
  cosmos.container(config.COSMOSDB_CONTAINER_SERVICES_PUBLICATION),
  ServicePublication.ItemType
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

// entrypoint for all http functions
export const httpEntryPoint = pipe(
  {
    basePath: BASE_PATH,
    apimClient,
    config,
    fsmLifecycleClient,
    fsmPublicationClient,
    subscriptionCIDRsModel,
    telemetryClient,
  },
  createWebServer,
  expressToAzureFunction
);

export const createRequestReviewEntryPoint = createRequestReviewHandler(
  getDao(config),
  jiraProxy(jiraClient(config)),
  apimProxy(
    getApimClient(config, config.AZURE_SUBSCRIPTION_ID),
    config.AZURE_APIM_RESOURCE_GROUP,
    config.AZURE_APIM
  )
);

export const createRequestPublicationEntryPoint =
  createRequestPublicationHandler(fsmPublicationClient);

export const onRequestSyncCmsEntryPoint = createRequestSyncCmsHandler(
  fsmLifecycleClient,
  fsmPublicationClient
);

export const onRequestSyncLegacyEntryPoint =
  createRequestSyncLegacyHandler(legacyServiceModel);

export const createRequestHistoricizationEntryPoint =
  createRequestHistoricizationHandler();

export const serviceReviewCheckerEntryPoint = createReviewCheckerHandler(
  getDao(config),
  jiraProxy(jiraClient(config)),
  fsmLifecycleClient
);

export const createRequestReviewLegacyEntryPoint =
  createRequestReviewLegacyHandler(
    fsmLifecycleClient,
    getDao({
      ...config,
      REVIEWER_DB_TABLE: `${config.REVIEWER_DB_TABLE}-legacy` as NonEmptyString,
    })
  );

export const serviceReviewLegacyCheckerEntryPoint =
  createReviewLegacyCheckerHandler(
    getDao({
      ...config,
      REVIEWER_DB_TABLE: `${config.REVIEWER_DB_TABLE}_legacy` as NonEmptyString,
    }),
    jiraProxy(
      jiraClient({ ...config, JIRA_PROJECT_NAME: "IES" as NonEmptyString })
    ),
    fsmLifecycleClient
  );

export const onServiceLifecycleChangeEntryPoint = pipe(
  onServiceLifecycleChangeHandler(config),
  processBatchOf(ServiceLifecycle.ItemType),
  setBindings((results) => ({
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
  onLegacyServiceChangeHandler(jiraLegacyClient(config), config, apimClient),
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
  onServiceHistoryHandler(config, apimClient),
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
