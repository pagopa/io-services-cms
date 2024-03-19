import {
  BulkOperationType,
  Container,
  ReadOperationInput,
} from "@azure/cosmos";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import * as B from "fp-ts/boolean";
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import * as TE from "fp-ts/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import * as t from "io-ts";
import { FSMStore, WithState } from "./types";

type CosmosStore<T extends WithState<string, Record<string, unknown>>> =
  FSMStore<T>;

export const createCosmosStore = <
  T extends WithState<string, Record<string, unknown>>
>(
  container: Container,
  codec: t.Type<T>
): CosmosStore<T> => {
  const fetch = (id: string) =>
    pipe(
      // fetch the item by its id
      TE.tryCatch(
        () => container.item(id, id).read(),
        (err) =>
          new Error(
            `Failed to read item id#${id} from database, ${
              E.toError(err).message
            }`
          )
      ),
      TE.chain((rr) =>
        rr.statusCode === 404
          ? // if the item isn't found, it's ok
            TE.right(O.none)
          : // if present, try to decode in the expected shape
            pipe(
              {
                ...rr.resource,
                // eslint-disable-next-line no-underscore-dangle
                last_update: new Date(rr.resource._ts * 1000).toISOString(), // Unix timestamp
                version: rr.etag,
              },
              codec.decode,
              E.map(O.some),
              TE.fromEither,
              TE.mapLeft(
                (err) =>
                  new Error(
                    `Unable to parse resorce from the database, ${readableReport(
                      err
                    )}`
                  )
              )
            )
      )
    );

  const buildReadOperations = (ids: string[]): ReadOperationInput[] =>
    ids.map((id) => ({
      partitionKey: id,
      operationType: BulkOperationType.Read,
      id,
    }));

  const bulkFetch = (ids: string[]) =>
    pipe(
      // bulk fetch of items by id
      TE.tryCatch(
        () =>
          container.items.bulk(buildReadOperations(ids), {
            continueOnError: true,
          }),
        (err) =>
          new Error(
            `Failed to bulk read items from database, ${E.toError(err).message}`
          )
      ),
      TE.map((operationResponses) =>
        operationResponses.map(
          flow(
            O.fromPredicate((res) => res.statusCode === 200),
            // if present, try to decode in the expected shape
            O.chain((res) =>
              pipe(
                {
                  ...res.resourceBody,
                  last_update: res.resourceBody
                    ? new Date(
                        // eslint-disable-next-line no-underscore-dangle
                        (res.resourceBody._ts as number) * 1000
                      ).toISOString() // Unix timestamp
                    : new Date().toISOString(),
                  version: res.eTag,
                },
                codec.decode,
                E.fold(() => O.none, O.some)
              )
            )
          )
        )
      )
    );

  const save = (id: string, value: T) =>
    pipe(
      TE.tryCatch(
        () => container.items.upsert({ ...value, id }),
        (err) =>
          new Error(
            `Failed to save item id#${id} from database, ${
              E.toError(err).message
            }`
          )
      ),
      TE.map((itemResponse) => ({
        ...value,
        last_update: itemResponse.resource
          ? // eslint-disable-next-line no-underscore-dangle
            new Date(itemResponse.resource._ts * 1000).toISOString() // Unix timestamp
          : undefined,
        version: itemResponse.etag,
      }))
    );

  // https://learn.microsoft.com/en-us/rest/api/cosmos-db/delete-a-document
  // expected status code return are:
  // - 204: The documenti was successfully deleted.
  // - 404: The documenti was not found.
  const deleteItem = (id: string): TE.TaskEither<Error, void> =>
    pipe(
      TE.tryCatch(
        () => container.item(id, id).delete(),
        (err) =>
          new Error(
            `Failed to delete item id#${id} from database, ${
              E.toError(err).message
            }`
          )
      ),
      TE.chain((rr) =>
        pipe(
          rr.statusCode === 204 || rr.statusCode === 404,
          B.fold(
            () =>
              TE.left(
                new Error(
                  `Error response received from cosmosDB while deleting item id#${id}, status code: ${rr.statusCode}, container: ${container.url}`
                )
              ),
            () => TE.right(void 0)
          )
        )
      ),
      TE.map(() => void 0)
    );

  return { fetch, bulkFetch, save, delete: deleteItem };
};
