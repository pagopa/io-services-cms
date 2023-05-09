import { pipe } from "fp-ts/lib/function";
import { ServiceLifecycle, stores } from "@io-services-cms/models";
import { createWebServer } from "./webservice";
import { expressToAzureFunction } from "./lib/azure/adapters";
import { getConfigOrThrow } from "./config";
import { getApimClient } from "./apim_client";
import { getDatabase } from "./lib/azure/cosmos";

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unused-vars
const BASE_PATH = require("../host.json").extensions.http.routePrefix;

// the application global configuration
const config = getConfigOrThrow();

// client to interact with Api Management
const apimClient = getApimClient(config, config.AZURE_SUBSCRIPTION_ID);

// client to interact woth cms db
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
