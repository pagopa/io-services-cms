import {
  BulkOperationType,
  Container,
  ItemDefinition,
  ItemResponse,
  ReadOperationInput,
} from "@azure/cosmos";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import * as TE from "fp-ts/TaskEither";
import { flow, identity, pipe } from "fp-ts/lib/function";
import * as t from "io-ts";

import { unixSecondsToMillis, unixTimestamp } from "../../utils/date-utils";
import { FSMStore, WithState } from "./types";

type CosmosStore<T extends WithState<string, Record<string, unknown>>> =
  FSMStore<T>;

export const createCosmosStore = <
  T extends WithState<string, Record<string, unknown>>,
>(
  container: Container,
  codec: t.Type<T>,
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
            }`,
          ),
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
                modified_at:
                  rr.resource?.modified_at ??
                  (rr.resource?._ts
                    ? unixSecondsToMillis(rr.resource._ts)
                    : unixTimestamp()),
                version: rr.etag,
              },
              codec.decode,
              E.map(O.some),
              TE.fromEither,
              TE.mapLeft(
                (err) =>
                  new Error(
                    `Unable to parse resorce from the database, ${readableReport(
                      err,
                    )}`,
                  ),
              ),
            ),
      ),
    );

  const buildReadOperations = (ids: string[]): ReadOperationInput[] =>
    ids.map((id) => ({
      id,
      operationType: BulkOperationType.Read,
      partitionKey: id,
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
            `Failed to bulk read items from database, ${E.toError(err).message}`,
          ),
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
                  modified_at:
                    res.resourceBody?.modified_at ??
                    (res.resourceBody?._ts
                      ? unixSecondsToMillis(res.resourceBody._ts as number)
                      : unixTimestamp()),
                  version: res.eTag,
                },
                codec.decode,
                E.fold(() => O.none, O.some),
              ),
            ),
          ),
        ),
      ),
    );

  const save = (id: string, value: T, preserveModifiedAt = false) =>
    pipe(
      value,
      // last_update is not part of the value to save
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ({ last_update, modified_at, version, ...valueToSave }) =>
        TE.tryCatch(
          () =>
            container.items.upsert({
              ...valueToSave,
              id,
              modified_at: preserveModifiedAt ? modified_at : unixTimestamp(),
            }),
          (err) =>
            new Error(
              `Failed to save item id#${id} from database, ${
                E.toError(err).message
              }`,
            ),
        ),
      TE.map((itemResponse: ItemResponse<ItemDefinition>) => ({
        ...value,
        modified_at:
          itemResponse.resource?.modified_at ??
          (itemResponse.resource?._ts
            ? unixSecondsToMillis(itemResponse.resource._ts)
            : unixTimestamp()),
        version: itemResponse.etag,
      })),
    );

  // https://learn.microsoft.com/en-us/rest/api/cosmos-db/delete-a-document
  // expected status code return are:
  // - 204: The document was successfully deleted.
  // - 404: The document was not found.
  const deleteItem = (id: string): TE.TaskEither<Error, void> =>
    pipe(
      TE.tryCatch(() => container.item(id, id).delete(), identity),
      TE.map(() => void 0),
      TE.orElse((err) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const code = (err as any).code; // Extract code property
        return code === 404 ? TE.right(void 0) : TE.left(E.toError(err));
      }),
    );

  const getServiceIdsByGroupIds = (
    groupIds: readonly string[],
  ): TE.TaskEither<Error, string[]> =>
    pipe(
      TE.tryCatch(
        () =>
          container.items
            .query<string>({
              parameters: [{ name: "@groupIds", value: groupIds }],
              query:
                "SELECT VALUE c.id FROM c WHERE ARRAY_CONTAINS(@groupIds, c.data.metadata.group_id)",
            })
            .fetchAll(),
        (err) =>
          new Error(
            `Error fetching services from database with groupIds=${groupIds}, ${
              E.toError(err).message
            }`,
          ),
      ),
      TE.map(({ resources }) => resources),
    );

  return {
    bulkFetch,
    delete: deleteItem,
    fetch,
    getServiceIdsByGroupIds,
    save,
  };
};
