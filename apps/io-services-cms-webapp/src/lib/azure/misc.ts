import { Context } from "@azure/functions";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import * as RA from "fp-ts/lib/ReadonlyArray";
import { flow, pipe } from "fp-ts/lib/function";
import * as t from "io-ts";
import { Json, JsonFromString } from "io-ts-types";
import { AzureFunctionCall } from "./adapters";

/**
 * Trace an incoming error and return it. To be added in a pipeline for not interrupt the flow.
 *
 * @param context the context of the Azure function
 * @param label defines the error family and meaning
 * @returns an error
 */
export const logError =
  (context: Context, label: string) =>
  (reason: string | Error): Error => {
    const err =
      reason instanceof Error ? reason : new Error(`${label}|${reason}`);
    context.log.error(
      `${context.executionContext.functionName}|${err.message}|||${context.executionContext.invocationId}`
    );
    return err;
  };

export const log = (
  context: Context,
  message: string,
  level: keyof Context["log"] = "info"
) => {
  context.log[level](
    `${context.executionContext.functionName}|${message}|||${context.executionContext.invocationId}`
  );
};

/**
 * Wrap a function handler so that every input is a valid JSON object
 * Useful to normalize input coming from queueTrigger, which could be bot a parsed object or a stringified object
 *
 * @param handler the handler to be executed
 * @param logPrefix
 * @returns
 */
export const withJsonInput =
  (
    handler: (
      context: Context,
      ...parsedInputs: ReadonlyArray<Json>
    ) => Promise<unknown>
  ) =>
  (context: Context, ...inputs: ReadonlyArray<unknown>): Promise<unknown> =>
    pipe(
      inputs,
      RA.map((input) =>
        pipe(
          input,
          t.string.decode,
          E.chain(JsonFromString.decode),
          E.fold((_) => Json.decode(input), E.of)
        )
      ),
      RA.sequence(E.Applicative),
      E.mapLeft(
        flow(
          readableReport,
          logError(context, "Cannot parse incoming queue item into JSON object")
        )
      ),
      E.getOrElseW((err) => {
        throw err;
      }),
      (parsedInputs) => handler(context, ...parsedInputs)
    );

/**
 * Given a procedure that elaborates a single, well-shaped item, it is applied to a batch of items of unknown shape.
 * Items are initially parsed and then passed to the procedure, in sequence or in parallel according to options.
 * The result of the batch is either the array of the results of all called procedures or an Error.
 * The procedure has the form of a ReaderTaskEither expecting the item as a state.
 *
 * The usage is intended for azure functions that has batched inputs such as CosmosDB-triggered functions.
 *
 * @param itemShape A io-ts codec defining the expected shape of an item
 * @param options.parallel Process each items in parallel. Default: true
 * @param options.ignoreMalformedItems Ignore items that don't parse according to the provided schema.
 *                                     If true, well-formed items will be processed anyway.
 *                                     If false, the whole batch fails if at lease one item is malfomed
 * @returns Either an error or all the results of the procedure applied on every item,
 *          collected into an array
 */
export const processBatchOf =
  <T>(
    itemShape: t.Type<T>,
    {
      parallel = true,
      ignoreMalformedItems = false,
    }: {
      parallel?: boolean;
      ignoreMalformedItems?: boolean;
    } = {}
  ) =>
  /**
   * @param processSingleItem the procedure that elaborate the single item
   * @returns Either an error or all the results of the procedure applied on every item,
   *          collected into an array
   */
  <R>(
    processSingleItem: RTE.ReaderTaskEither<{ item: T }, Error, R>
  ): RTE.ReaderTaskEither<AzureFunctionCall, Error, ReadonlyArray<R>> =>
  ({
    context,
    inputs: [items],
    ...rest
  }): TE.TaskEither<Error, ReadonlyArray<R>> =>
    pipe(
      typeof items === "undefined"
        ? []
        : Array.isArray(items)
        ? items
        : [items],
      // Parse all elements to match the expected type
      RA.map(itemShape.decode),
      RA.separate,
      ({ left, right }) => {
        // either there are not malformed documents or we decided to ignore them,
        //   we can process all well-formed documents
        if (ignoreMalformedItems || left.length === 0) {
          left.map((i) =>
            log(
              context,
              `Ignoring document, failed to parse: ${JSON.stringify(i)}`
            )
          );
          log(context, `Processing ${right.length} items`);
          return TE.right(right);
        }
        // else, fail the whole batch if at least one item is malformed
        const msg = `Failed parsing the batch of items. Found errors in ${
          left.length
        } out of ${right.length + left.length} items.`;
        log(context, msg, "error");
        return TE.left<Error, ReadonlyArray<T>>(new Error());
      },
      TE.map(RA.map((item) => processSingleItem({ item, ...rest }))),
      TE.chain(RA.sequence(parallel ? TE.ApplicativePar : TE.ApplicativeSeq))
    );

/**
 * A utility function that assigns a set of values to Azure Functions output bindings.
 * The aim of the utility is to allow a procedure to interact with bindings seamlessly,
 * without having to know the context of the Azure Function nor to deal with wiring code needed.
 * It takes a formatter function that creates a key/value record,
 * being each key the name of an output binding to be assigned.
 *
 * It does not alter the procedure as it passes the original result forward.
 *
 * @param formatter Takes the result value of the procedure and create a record
 *                  that describes what to assign to bindings.
 * @param procedure the procedure to get results from
 * @returns the provided procedure, untouched.
 */
export const setBindings =
  <E, L, R>(formatter: (a: R) => Record<string, unknown>) =>
  /**
   * @param procedure the procedure to get results from
   * @returns the provided procedure, untouched.
   */
  (
    procedure: RTE.ReaderTaskEither<E & AzureFunctionCall, L, R>
  ): RTE.ReaderTaskEither<E & AzureFunctionCall, L, R> =>
    pipe(
      procedure,
      RTE.chain(
        (results) =>
          ({ context }) =>
            pipe(
              results,
              formatter,
              Object.entries,
              RA.map(
                ([key, value]) =>
                  // eslint-disable-next-line functional/immutable-data
                  (context.bindings[key] = value)
              ),
              (_) => TE.right(results)
            )
      )
    );
