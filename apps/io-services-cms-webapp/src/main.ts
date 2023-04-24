import { pipe } from "fp-ts/lib/function";
import { createWebServer, toAzureFunction } from "./webservice";

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unused-vars
const BASE_PATH = require("../host.json").extensions.http.routePrefix;

// entrypoint for all http functions
export const httpEntryPoint = pipe(
  { basePath: BASE_PATH },
  createWebServer,
  toAzureFunction
);
