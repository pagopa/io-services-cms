import { pipe } from "fp-ts/lib/function";
import { getApimClient } from "./apim_client";
import { getConfigOrThrow } from "./config";
import { JiraAPIClient } from "./jira_client";
import { expressToAzureFunction } from "./lib/azure/adapters";
import { createRequestReviewHandler } from "./reviewer/request-review-handler";
import { apimProxy } from "./utils/apim-proxy";
import { getDao } from "./utils/service-review-dao";
import { ServiceReviewProxy } from "./utils/service_review_proxy";
import { createWebServer } from "./webservice";

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unused-vars
const BASE_PATH = require("../host.json").extensions.http.routePrefix;

// entrypoint for all http functions
export const httpEntryPoint = pipe(
  { basePath: BASE_PATH },
  createWebServer,
  expressToAzureFunction
);

const config = getConfigOrThrow();

export const queueEntryPoint = createRequestReviewHandler(
  getDao(config),
  ServiceReviewProxy(JiraAPIClient(config)),
  apimProxy(
    getApimClient(config, config.AZURE_SUBSCRIPTION_ID),
    config.AZURE_APIM_RESOURCE_GROUP,
    config.AZURE_APIM
  )
);
