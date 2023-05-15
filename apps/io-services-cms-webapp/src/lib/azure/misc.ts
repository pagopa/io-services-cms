import { Context, AzureFunction } from "@azure/functions";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import * as RA from "fp-ts/lib/ReadonlyArray";
import { flow, pipe } from "fp-ts/lib/function";
import * as t from "io-ts";
import { Json, JsonFromString } from "io-ts-types";

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

type ProcessBatchOptions = {
  // process each document in parallel
  parallel: boolean;
  // ignore documents that don't parse according to the provided schema
  // if true, well-formed documents will be processed anyway
  // if false, the whole batch fails if at lease one document is malfomed
  ignoreMalformedDocuments: boolean;
};

export const processBatchOf =
  <T>(
    codec: t.Type<T>,
    options: ProcessBatchOptions = {
      parallel: true,
      ignoreMalformedDocuments: false,
    }
  ) =>
  <R>(
    processSingleDocument: RTE.ReaderTaskEither<{ document: T }, Error, R>
  ): RTE.ReaderTaskEither<
    { context: Context; documents: unknown },
    Error,
    ReadonlyArray<R>
  > =>
  ({ context, documents }): TE.TaskEither<Error, ReadonlyArray<R>> =>
    pipe(
      Array.isArray(documents) ? documents : [documents],
      // Parse all elements to match the expected type
      RA.map(codec.decode),
      RA.separate,
      ({ left, right }) => {
        // either there are not malformed documents or we decided to ignore them,
        //   we can process all well-formed documents
        if (options.ignoreMalformedDocuments || left.length === 0) {
          left.map((i) =>
            log(
              context,
              `Ignoring document, failed to parse: ${JSON.stringify(i)}`
            )
          );
          log(context, `Processing ${right.length} documents`);
          return TE.right(right);
        }
        // else, fail the whole batch if at least one document is malformed
        const msg = `Failed parsing the batch of documents. Found errors in ${
          left.length
        } out of ${right.length + left.length} items.`;
        log(context, msg, "error");
        return TE.left<Error, ReadonlyArray<T>>(new Error());
      },
      TE.map(RA.map((document) => processSingleDocument({ document }))),
      TE.chain(
        RA.sequence(options.parallel ? TE.ApplicativePar : TE.ApplicativeSeq)
      )
    );

export const setBindings =
  <E, L, R>(fn: (a: R) => Record<string, unknown>) =>
  (
    rte: RTE.ReaderTaskEither<E & { context: Context }, L, R>
  ): RTE.ReaderTaskEither<E & { context: Context }, L, R> =>
    pipe(
      rte,
      RTE.chain(
        (results) =>
          ({ context }) =>
            pipe(
              results,
              fn,
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
