import { Container, SqlQuerySpec } from "@azure/cosmos";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { enumType } from "@pagopa/ts-commons/lib/types";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as RA from "fp-ts/lib/ReadonlyArray";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import * as t from "io-ts";

export enum OrderParamEnum {
  "ASC" = "ASC",
  "DESC" = "DESC",
}

export type OrderParam = t.TypeOf<typeof OrderParam>;
export const OrderParam = enumType<OrderParamEnum>(OrderParamEnum, "order");

export type Page<T> = {
  resources: ReadonlyArray<T>;
  continuationToken?: string;
};

export type CosmosHelper = {
  fetchSingleItem: <T>(
    query: SqlQuerySpec,
    codec: t.Type<T>
  ) => TE.TaskEither<Error, O.Option<T>>;
  fetchItems: <T>(
    query: SqlQuerySpec,
    codec: t.Type<T>
  ) => TE.TaskEither<Error, O.Option<ReadonlyArray<T>>>;
};

export type CosmosPagedHelper<T> = {
  pageFetch: (
    query: SqlQuerySpecWithOrder,
    limit?: number,
    continuationToken?: string
  ) => TE.TaskEither<Error, O.Option<Page<T>>>;
};

export type SqlQuerySpecWithOrder = SqlQuerySpec & {
  order?: OrderParam;
  orderBy?: string;
};

export const makeCosmosHelper = (container: Container): CosmosHelper => {
  const fetchSingleItem = <T>(
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
          (err) => new Error(`Failed to fetchSingleItem: ${err}`)
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
    );

  const fetchItems = <T>(
    query: SqlQuerySpec,
    codec: t.Type<T>
  ): TE.TaskEither<Error, O.Option<ReadonlyArray<T>>> =>
    pipe(
      E.tryCatch(
        () => container.items.query(query),
        (err) => new Error(`Failed to query CosmosDB: ${err}`)
      ),
      TE.fromEither,
      TE.chainW((cosmosQueryIterator) =>
        TE.tryCatch(
          () => cosmosQueryIterator.fetchAll(),
          (err) => new Error(`Failed to fetchItems: ${err}`)
        )
      ),
      TE.chainW(({ resources }) =>
        pipe(
          resources,
          O.fromPredicate((r) => r.length > 0),
          O.fold(
            () => TE.right(O.none),
            flow(
              RA.traverse(E.Applicative)(codec.decode),
              E.bimap(flow(readableReport, E.toError), (mappedResult) =>
                O.some(mappedResult)
              ),
              TE.fromEither
            )
          )
        )
      )
    );

  return {
    fetchSingleItem,
    fetchItems,
  };
};

const buildQuerySpec = (
  querySpecWithOrder: SqlQuerySpecWithOrder
): SqlQuerySpec => {
  const query =
    querySpecWithOrder.order && querySpecWithOrder.orderBy
      ? `${querySpecWithOrder.query} ORDER BY c.${querySpecWithOrder.orderBy} ${querySpecWithOrder.order}`
      : querySpecWithOrder.query;

  return {
    query,
    parameters: querySpecWithOrder.parameters,
  };
};

export const makeCosmosPagedHelper = <T>(
  codec: t.Type<T>,
  container: Container,
  defualtPageFetchSize: number
): CosmosPagedHelper<T> => ({
  pageFetch: (
    query: SqlQuerySpecWithOrder,
    limit = defualtPageFetchSize,
    continuationToken?: string
  ): TE.TaskEither<Error, O.Option<Page<T>>> =>
    pipe(
      E.tryCatch(
        () =>
          container.items.query(buildQuerySpec(query), {
            maxItemCount: limit,
            continuation: continuationToken,
          }),
        (err) => new Error(`Failed to query CosmosDB: ${err}`)
      ),
      TE.fromEither,
      TE.chainW((cosmosQueryIterator) =>
        TE.tryCatch(
          () => cosmosQueryIterator.fetchNext(),
          (err) => new Error(`Failed to fetch next page: ${err}`)
        )
      ),
      TE.chainW((page) =>
        pipe(
          page.resources,
          O.fromPredicate((r) => r.length > 0),
          O.fold(
            () => TE.right(O.none),
            flow(
              RA.traverse(E.Applicative)(codec.decode),
              E.bimap(flow(readableReport, E.toError), (mappedResult) =>
                O.some({
                  continuationToken: page.continuationToken,
                  resources: mappedResult,
                })
              ),
              TE.fromEither
            )
          )
        )
      )
    ),
});
