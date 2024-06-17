import { app } from "@azure/functions";
import { DefaultAzureCredential } from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";
import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/lib/function";
import { applicationInsightInit } from "./utils/applicationinsight/helper";

import { getConfigOrError } from "./config";
import { GetFeaturedInstitutionsFn } from "./functions/featured-institutions";
import { GetFeaturedServicesFn } from "./functions/featured-services";
import { GetServiceByIdFn } from "./functions/get-service-by-id";
import { InfoFn } from "./functions/info";
import { SearchInstitutionsFn } from "./functions/search-institutions";
import { SearchServicesFn } from "./functions/search-services";
import { Institution } from "./generated/definitions/internal/Institution";
import { ServiceMinified } from "./generated/definitions/internal/ServiceMinified";
import { makeAzureSearchClient } from "./utils/azure-search/client";
import { buildServiceDetailsContainerDependency } from "./utils/cosmos-db/helper";

// Application Insights SDK bootstrapping
applicationInsightInit();

const config = pipe(
  getConfigOrError(),
  E.getOrElseW((error) => {
    throw error;
  })
);
// Handlers Depedencies
const blobServiceClient = new BlobServiceClient(
  `https://${config.FEATURED_ITEMS_STORAGE_ACCOUNT_NAME}.blob.core.windows.net`,
  new DefaultAzureCredential()
);

// Service Details Container Dependency
const serviceDetailsContainerDependency =
  buildServiceDetailsContainerDependency(config);

const institutionsSearchClient = makeAzureSearchClient(
  Institution,
  config.AZURE_SEARCH_ENDPOINT,
  config.AZURE_SEARCH_SERVICE_VERSION,
  config.AZURE_SEARCH_INSTITUTIONS_INDEX_NAME,
  config.AZURE_SEARCH_API_KEY
);

const servicesSearchClient = makeAzureSearchClient(
  ServiceMinified,
  config.AZURE_SEARCH_ENDPOINT,
  config.AZURE_SEARCH_SERVICE_VERSION,
  config.AZURE_SEARCH_SERVICES_INDEX_NAME,
  config.AZURE_SEARCH_API_KEY
);

const Info = InfoFn(config)({
  ...serviceDetailsContainerDependency,
  searchClient: institutionsSearchClient,
  blobServiceClient,
});
app.http("Info", {
  authLevel: "anonymous",
  handler: Info,
  methods: ["GET"],
  route: "info",
});

const GetFeaturedServices = GetFeaturedServicesFn(config)({
  blobServiceClient,
});
app.http("GetFeaturedServices", {
  methods: ["GET"],
  route: "services/featured",
  authLevel: "anonymous",
  handler: GetFeaturedServices,
});

const GetFeaturedInstitutions = GetFeaturedInstitutionsFn(config)({
  blobServiceClient,
});
app.http("GetFeaturedInstitutions", {
  methods: ["GET"],
  route: "institutions/featured",
  authLevel: "anonymous",
  handler: GetFeaturedInstitutions,
});

const SearchInstitutions = SearchInstitutionsFn(config)({
  searchClient: institutionsSearchClient,
});
app.http("SearchInstitutions", {
  authLevel: "anonymous",
  handler: SearchInstitutions,
  methods: ["GET"],
  route: "institutions",
});

const SearchServices = SearchServicesFn(config)({
  searchClient: servicesSearchClient,
});
app.http("SearchServices", {
  authLevel: "anonymous",
  handler: SearchServices,
  methods: ["GET"],
  route: "institutions/{institutionId}/services",
});

const GetServiceById = GetServiceByIdFn(serviceDetailsContainerDependency);
app.http("GetServiceById", {
  authLevel: "anonymous",
  handler: GetServiceById,
  methods: ["GET"],
  route: "services/{serviceId}",
});
