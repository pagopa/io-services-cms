import { InvocationContext } from "@azure/functions";
import * as E from "fp-ts/lib/Either";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import { pipe } from "fp-ts/lib/function";

/**
 * @typedef AzureFunctionCall Describe the context of an Azure Function invocation alongside its inputs
 */
export interface AzureFunctionCall {
  context: InvocationContext;
  inputs: unknown[];
}

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
  <L, R>(procedure: RTE.ReaderTaskEither<AzureFunctionCall, L, R>) =>
  (input: unknown, context: InvocationContext) =>
    pipe(
      procedure,
      RTE.getOrElseW((f) => {
        const error =
          f instanceof Error
            ? f
            : new UnhandledProcedureError(context, E.toError(f).message);
        throw error;
      }),
    )({ context, inputs: typeof input === "undefined" ? [] : [input] })();

class UnhandledProcedureError extends Error {
  constructor(context: InvocationContext, message?: string) {
    const formattedMessage = `${context.functionName} failed, error: ${message}`;
    super(formattedMessage);
  }
}
