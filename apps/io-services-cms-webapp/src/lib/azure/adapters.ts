import { AzureFunction, Context } from "@azure/functions";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import { Express } from "express";
import { setAppContext } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/context_middleware";
import createAzureFunctionHandler from "@pagopa/express-azure-functions/dist/src/createAzureFunctionsHandler";
import { pipe } from "fp-ts/lib/function";
import { log } from "./misc";

/**
 *
 * @param app
 * @returns
 */
export const expressToAzureFunction =
  (app: Express): AzureFunction =>
  (context: Context): void => {
    setAppContext(app, context);
    createAzureFunctionHandler(app)(context);
  };

/**
 *
 * @param app
 * @returns
 */
export const toAzureFunctionHandler =
  <L, R>(
    rte: RTE.ReaderTaskEither<{ context: Context; documents: unknown }, L, R>
  ): AzureFunction =>
  (context, documents) =>
    pipe(
      rte,
      RTE.getOrElseW((f) => {
        const error =
          f instanceof Error
            ? f
            : new Error(`${f}` /* TODO: format a readable message */);
        log(context, error.message, "error");
        throw error;
      })
    )({ context, documents })();
