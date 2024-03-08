import { Container, SqlQuerySpec } from "@azure/cosmos";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as RA from "fp-ts/lib/ReadonlyArray";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import * as t from "io-ts";

export type CosmosHelper = {
  fetchSingleItem: <T>(
    query: SqlQuerySpec,
    codec: t.Type<T>
  ) => TE.TaskEither<Error, O.Option<T>>;
};

export const makeCosmosHelper = (container: Container): CosmosHelper => ({
  fetchSingleItem: <T>(
    query: SqlQuerySpec,
    codec: t.Type<T>
  ): TE.TaskEither<Error, O.Option<T>> =>
    pipe(
      E.tryCatch(
        () => container.items.query(query),
        (err) => new Error(`Failed to query CosmosDB: ${err}`)
      ),
      TE.fromEither,
      TE.chainW((cosmosQueryIterator) =>
        TE.tryCatch(
          () => cosmosQueryIterator.fetchAll(),
          (err) => new Error(`Failed to retrieve data: ${err}`)
        )
      ),
      TE.chainW(({ resources }) =>
        pipe(
          resources,
          RA.head,
          O.fold(
            () => TE.right(O.none),
            flow(
              codec.decode,
              E.bimap(flow(readableReport, E.toError), (mappedResult) =>
                O.some(mappedResult)
              ),
              TE.fromEither
            )
          )
        )
      )
    ),
});
