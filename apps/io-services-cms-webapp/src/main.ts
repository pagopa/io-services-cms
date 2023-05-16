import { ServiceLifecycle, stores } from "@io-services-cms/models";
import { pipe } from "fp-ts/lib/function";
import { getConfigOrThrow } from "./config";
import { expressToAzureFunction } from "./lib/azure/adapters";
import { getDatabase } from "./lib/azure/cosmos";
import { getApimClient } from "./lib/clients/apim-client";
import { jiraClient } from "./lib/clients/jira-client";
import { createRequestReviewHandler } from "./reviewer/request-review-handler";
import { createReviewCheckerHandler } from "./reviewer/review-checker-handler";
import { apimProxy } from "./utils/apim-proxy";
import { jiraProxy } from "./utils/jira-proxy";
import { getDao } from "./utils/service-review-dao";
import { createWebServer } from "./webservice";
import { handler as OnLegacyServiceChangeHandler } from "./watchers/on-legacy-service-change";

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

// entrypoint for all http functions
export const httpEntryPoint = pipe(
  {
    basePath: BASE_PATH,
    apimClient,
    config,
    serviceLifecycleStore,
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

export const serviceReviewCheckerEntryPoint = createReviewCheckerHandler(
  getDao(config),
  jiraProxy(jiraClient(config)),
  serviceLifecycleStore
);

export const onLegacyServiceChangeEntryPoint = OnLegacyServiceChangeHandler;
