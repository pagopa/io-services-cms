import {
  ServiceLifecycle,
  ServicePublication,
  stores,
} from "@io-services-cms/models";
import * as O from "fp-ts/Option";
import * as RA from "fp-ts/ReadonlyArray";
import * as RR from "fp-ts/ReadonlyRecord";
import { pipe } from "fp-ts/lib/function";
import { getConfigOrThrow } from "./config";
import {
  expressToAzureFunction,
  toAzureFunctionHandler,
} from "./lib/azure/adapters";
import { getDatabase } from "./lib/azure/cosmos";
import { getApimClient } from "./lib/clients/apim-client";
import { jiraClient } from "./lib/clients/jira-client";
import { createRequestReviewHandler } from "./reviewer/request-review-handler";
import { createReviewCheckerHandler } from "./reviewer/review-checker-handler";
import { createRequestPublicationHandler } from "./publicator/request-publication-handler";
import { apimProxy } from "./utils/apim-proxy";
import { jiraProxy } from "./utils/jira-proxy";
import { createWebServer } from "./webservice";

import { processBatchOf, setBindings } from "./lib/azure/misc";
import { handler as onServiceLifecycleChangeHandler } from "./watchers/on-services-lifecycles-change";
import { handler as onServicePublicationChangeHandler } from "./watchers/on-service-publication-change";

import { getDao } from "./utils/service-review-dao";

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
  cosmos.container(config.COSMOSDB_CONTAINER_SERVICE_LIFECYCLE),
  ServiceLifecycle.ItemType
);

// create a store for the ServicePublication finite state machine
const servicePublicationStore = stores.createCosmosStore(
  cosmos.container(config.COSMOSDB_CONTAINER_SERVICE_PUBBLICATIONS),
  ServicePublication.ItemType
);

// entrypoint for all http functions
export const httpEntryPoint = pipe(
  {
    basePath: BASE_PATH,
    apimClient,
    config,
    serviceLifecycleStore,
    servicePublicationStore,
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
  createRequestPublicationHandler(servicePublicationStore);

export const serviceReviewCheckerEntryPoint = createReviewCheckerHandler(
  getDao(config),
  jiraProxy(jiraClient(config)),
  serviceLifecycleStore
);

export const onServiceLifecycleChangeEntryPoint = pipe(
  onServiceLifecycleChangeHandler,
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
  })),
  toAzureFunctionHandler
);

export const onServicePublicationChangeEntryPoint = pipe(
  onServicePublicationChangeHandler,
  processBatchOf(ServicePublication.ItemType),
  setBindings((results) => ({
    requestHistory: pipe(
      results,
      RA.map(RR.lookup("requestHistory")),
      RA.filter(O.isSome),
      RA.map((item) => pipe(item.value, JSON.stringify))
    ),
  })),
  toAzureFunctionHandler
);
