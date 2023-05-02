import { pipe } from "fp-ts/lib/function";
import { getConfigOrThrow } from "./config";
import { expressToAzureFunction } from "./lib/azure/adapters";
import { handleRequestReview } from "./reviewer/request-review-handler";
import { getDao } from "./utils/service-review-dao";
import { createWebServer } from "./webservice";
import { ServiceReviewProxy } from "./utils/service_review_proxy";
import { JiraAPIClient } from "./jira_client";
import { apimProxy } from "./utils/apim-proxy";
import { getApimClient } from "./apim_client";

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unused-vars
const BASE_PATH = require("../host.json").extensions.http.routePrefix;

// entrypoint for all http functions
export const httpEntryPoint = pipe(
  { basePath: BASE_PATH },
  createWebServer,
  expressToAzureFunction
);

const config = getConfigOrThrow();

export const queueEntryPoint = handleRequestReview({
  dao: getDao(config),
  jiraProxy: ServiceReviewProxy(JiraAPIClient(config)),
  apimProxy: apimProxy(
    getApimClient(config, config.AZURE_SUBSCRIPTION_ID),
    config.AZURE_APIM_RESOURCE_GROUP,
    config.AZURE_APIM
  ),
});
