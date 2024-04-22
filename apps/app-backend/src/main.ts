import { app } from "@azure/functions";
import { createBlobService } from "azure-storage";
import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/lib/function";
import { InfoFn } from "./functions/info";
import { GetFeaturedItemsFn } from "./functions/featured-items";
import { getConfigOrError } from "./config";
import { Institution } from "./generated/definitions/internal/Institution";
import { makeAzureSearchClient } from "./utils/azure-search/client";
import { SearchInstitutionsFn } from "./functions/search-institutions";
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

const institutionsSearchClient = makeAzureSearchClient(
  Institution,
  config.AZURE_SEARCH_ENDPOINT,
  config.AZURE_SEARCH_INSTITUTIONS_INDEX_NAME,
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
