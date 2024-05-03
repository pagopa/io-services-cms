import { app } from "@azure/functions";
import { createBlobService } from "azure-storage";
import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/lib/function";
import { getConfigOrError } from "./config";
import { GetFeaturedItemsFn } from "./functions/featured-items";
import { GetServiceByIdFn } from "./functions/get-service-by-id";
import { InfoFn } from "./functions/info";
import { SearchInstitutionsFn } from "./functions/search-institutions";
import { SearchServicesFn } from "./functions/search-services";
import { Institution } from "./generated/definitions/internal/Institution";
import { ServiceMinified } from "./generated/definitions/internal/ServiceMinified";
import { makeAzureSearchClient } from "./utils/azure-search/client";
import { buildServiceDetailsContainerDependency } from "./utils/cosmos-db/helper";

const config = pipe(
  getConfigOrError(),
  E.getOrElseW((error) => {
    throw error;
  })
);
// Handlers Depedencies
const blobService = createBlobService(
  config.FEATURED_ITEMS_BLOB_CONNECTION_STRING
);

// Service Details Container Dependency
const serviceDetailsContainerDependency =
  buildServiceDetailsContainerDependency(config);

const institutionsSearchClient = makeAzureSearchClient(
  Institution,
  config.AZURE_SEARCH_ENDPOINT,
  config.AZURE_SEARCH_INSTITUTIONS_INDEX_NAME,
  config.AZURE_SEARCH_API_KEY
);

const servicesSearchClient = makeAzureSearchClient(
  ServiceMinified,
  config.AZURE_SEARCH_ENDPOINT,
  config.AZURE_SEARCH_SERVICES_INDEX_NAME,
  config.AZURE_SEARCH_API_KEY
);

const Info = InfoFn({});
app.http("Info", {
  authLevel: "anonymous",
  handler: Info,
  methods: ["GET"],
  route: "info",
});

const GetFeaturedItems = GetFeaturedItemsFn(config)({
  blobService,
});
app.http("GetFeaturedItems", {
  methods: ["GET"],
  route: "featured",
  authLevel: "anonymous",
  handler: GetFeaturedItems,
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
