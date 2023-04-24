/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { wrapRequestHandler } from "@pagopa/io-functions-commons/dist/src/utils/request_middleware";
import * as express from "express";
import {
  ResponseErrorInternal,
  ResponseSuccessJson,
} from "@pagopa/ts-commons/lib/responses";

import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import * as healthcheck from "@pagopa/io-functions-commons/dist/src/utils/healthcheck";

import { envConfig, IConfig } from "../config";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = require("../../package.json");

export const makeInfoHandler = (): express.RequestHandler => {
  const handler = pipe(
    envConfig,
    healthcheck.checkApplicationHealth(IConfig, [
      (c) =>
        healthcheck.checkAzureStorageHealth(
          c.INTERNAL_STORAGE_CONNECTION_STRING
        ),
    ]),
    TE.mapLeft((problems) => ResponseErrorInternal(problems.join("\n\n"))),
    TE.map((_) =>
      ResponseSuccessJson({
        name: packageJson.name,
        version: packageJson.version,
      })
    ),
    TE.toUnion
  );

  return wrapRequestHandler(handler);
};
