import * as healthcheck from "@pagopa/io-functions-commons/dist/src/utils/healthcheck";
import {
  ResponseErrorInternal,
  ResponseSuccessJson,
} from "@pagopa/ts-commons/lib/responses";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import { IConfig, envConfig } from "../../config";
import { healthcheck as checkPostgresDbHealth } from "../../lib/clients/pg-client";

// TODO: read these values from package json
const packageJson = { name: "io-services-cms-webapp", version: "0.0.0" };

export const makeInfoHandler = () =>
  pipe(
    envConfig,
    healthcheck.checkApplicationHealth(IConfig, [
      (c) =>
        healthcheck.checkAzureStorageHealth(
          c.INTERNAL_STORAGE_CONNECTION_STRING,
        ),
      (c) =>
        healthcheck.checkAzureCosmosDbHealth(c.COSMOSDB_URI, c.COSMOSDB_KEY),
      (c) => checkPostgresDbHealth(c),
    ]),
    TE.mapLeft((problems) => ResponseErrorInternal(problems.join("\n\n"))),
    TE.map((_) =>
      ResponseSuccessJson({
        name: packageJson.name,
        version: packageJson.version,
      }),
    ),
    TE.toUnion,
  );
