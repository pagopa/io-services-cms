import { AzureFunction, Context } from "@azure/functions";
import * as E from "fp-ts/lib/Either";
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
 * @typedef AzureFunctionCall Describe the context of an Azure Function invocation alongside its inputs
 */
export type AzureFunctionCall = { context: Context; inputs: unknown[] };

/**
 * Adapts a procedure in the form of a ReaderTaskReader into an AzureFunction.
 * The procedure is executed and, in case of a Left results, an exception is raised;
 * otherwise, void is returned.
 *
 * @param procedure A procedure in the form of a ReaderTaskEither.
 *                  It expects a AzureFunctionCall as state.
 * @returns nothing.
 * @throws an Error in case of a failing procedure.
 */
export const toAzureFunctionHandler =
  <L, R>(
    procedure: RTE.ReaderTaskEither<AzureFunctionCall, L, R>
  ): AzureFunction =>
  (context, ...inputs) =>
    pipe(
      procedure,
      RTE.getOrElseW((f) => {
        const error =
          f instanceof Error
            ? f
            : new UnhandledProcedureError(context, E.toError(f).message);
        log(context, error.message, "error");
        throw error;
      })
    )({ context, inputs })();

class UnhandledProcedureError extends Error {
  constructor(context: Context, message?: string) {
    const formattedMessage = `${context.executionContext.functionName} failed, error: ${message}`;
    super(formattedMessage);
  }
}
