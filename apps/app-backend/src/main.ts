import { app } from "@azure/functions";
import { createBlobService } from "azure-storage";
import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/lib/function";
import { getConfigOrError } from "./config";
import { GetFeaturedServicesIntitutionsFn } from "./functions/GetFeaturedServicesIntitutions";
import { InfoFn } from "./functions/Info";

const config = pipe(
    getConfigOrError(),
    E.getOrElseW((error) => {
      throw error;
    })
  );
// Handlers Depedencies
const blobService = createBlobService(config.FEATURED_ITEMS_BLOB_CONNECTION_STRING);

const Info = InfoFn({});
app.http("Info", {
  authLevel: "anonymous",
  handler: Info,
  methods: ["GET"],
  route: "info"
});

const GetFeaturedServicesIntitutions = GetFeaturedServicesIntitutionsFn({blobService});
app.http("GetFeaturedServicesIntitutions", {
  methods: ["GET"],
  route: "featured",
  authLevel: "anonymous",
  handler: GetFeaturedServicesIntitutions,
});