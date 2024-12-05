/* eslint-disable max-lines-per-function */
import {
  BulkOperationType,
  Container,
  ItemDefinition,
  ItemResponse,
  PatchOperation,
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

const fetch =
  <T extends WithState<string, Record<string, unknown>>>(
    container: Container,
    codec: t.Type<T>,
  ): CosmosStore<T>["fetch"] =>
  (id) =>
    pipe(
      TE.tryCatch(
        () => container.item(id, id).read(),
        (err) =>
          new Error(
            `Failed to read item id#${id} from database, ${
              E.toError(err).message
            }`,
          ),
      ),
      TE.chainEitherK((rr) =>
        rr.statusCode === 404
          ? // if the item isn't found, it's ok
            E.right(O.none)
          : // if present, try to decode in the expected shape
            pipe(
              {
                ...rr.resource,
                modified_at:
                  rr.resource?.modified_at ??
                  (rr.resource?._ts
                    ? unixSecondsToMillis(rr.resource._ts)
                    : unixTimestamp()),
                version: rr.etag,
              },
              codec.decode,
              E.map(O.some),
              E.mapLeft(
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

const bulkFetch =
  <T extends WithState<string, Record<string, unknown>>>(
    container: Container,
    codec: t.Type<T>,
  ): CosmosStore<T>["bulkFetch"] =>
  (ids) =>
    pipe(
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

const buildPatchOperations = ({
  data: {
    metadata: { group_id },
  },
}: {
  data: { metadata: { group_id?: string } };
}): PatchOperation[] => [
  {
    op: group_id ? "add" : "remove",
    path: "/data/metadata/group_id",
    value: group_id,
  },
  {
    op: "add",
    path: "/data/modified_at",
    value: unixTimestamp(),
  },
];

const bulkPatch =
  (
    container: Container,
  ): CosmosStore<WithState<string, Record<string, unknown>>>["bulkPatch"] =>
  (services) =>
    pipe(
      TE.tryCatch(
        () =>
          pipe(
            services.map((service) => ({
              id: service.id,
              operationType: BulkOperationType.Patch,
              partitionKey: service.id,
              resourceBody: { operations: buildPatchOperations(service) },
            })),
            (operations) =>
              container.items.bulk(operations, {
                continueOnError: true,
              }),
          ),
        (err) =>
          new Error(
            `Failed to bulk patch items from database, ${E.toError(err).message}`,
          ),
      ),
    );

const save =
  <T extends WithState<string, Record<string, unknown>>>(
    container: Container,
  ): CosmosStore<T>["save"] =>
  (id, value, preserveModifiedAt = false) =>
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

const patch =
  <T extends WithState<string, Record<string, unknown>>>(
    container: Container,
    codec: t.Type<T>,
  ): CosmosStore<T>["patch"] =>
  (id, serviceData) =>
    pipe(
      TE.tryCatch(
        () =>
          container.item(id, id).patch<T>({
            operations: buildPatchOperations(serviceData),
          }),
        (err) =>
          new Error(
            `Failed to save item id#${id} from database, ${
              E.toError(err).message
            }`,
          ),
      ),
      TE.chainEitherK(
        E.fromPredicate(
          (response) => response.statusCode >= 200 && response.statusCode < 300,
          (response) =>
            new Error(`Patch failed with status code ${response.statusCode}`),
        ),
      ),
      TE.chainEitherK((response) =>
        pipe(
          codec.decode(response.resource),
          E.mapLeft(flow(readableReport, E.toError)),
        ),
      ),
    );

// https://learn.microsoft.com/en-us/rest/api/cosmos-db/delete-a-document
// expected status code return are:
// - 204: The document was successfully deleted.
// - 404: The document was not found.
const deleteItem =
  (
    container: Container,
  ): CosmosStore<WithState<string, Record<string, unknown>>>["delete"] =>
  (id) =>
    pipe(
      TE.tryCatch(() => container.item(id, id).delete(), identity),
      TE.map(() => void 0),
      TE.orElse(
        flow(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          E.fromPredicate((err) => (err as any).code === 404, E.toError),
          E.map((_) => void 0),
          TE.fromEither,
        ),
      ),
    );

const getServiceIdsByGroupIds =
  (
    container: Container,
  ): CosmosStore<
    WithState<string, Record<string, unknown>>
  >["getServiceIdsByGroupIds"] =>
  (groupIds) =>
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

const getGroupUnboundedServicesByIds =
  (
    container: Container,
  ): CosmosStore<
    WithState<string, Record<string, unknown>>
  >["getGroupUnboundedServicesByIds"] =>
  (serviceIds) =>
    pipe(
      TE.tryCatch(
        () =>
          container.items
            .query<{ id: string; name: string }>({
              parameters: [{ name: "@serviceIds", value: serviceIds }],
              query: `SELECT c.id, c.data.name FROM c WHERE ARRAY_CONTAINS(@serviceIds, c.id) AND NOT IS_DEFINED(c.data.metadata.group_id)`,
            })
            .fetchAll(),
        (err) =>
          new Error(
            `Error fetching group-unbouded services from database, ${E.toError(err).message}`,
          ),
      ),
      TE.map(({ resources }) => resources),
    );

export const createCosmosStore = <
  T extends WithState<string, Record<string, unknown>>,
>(
  container: Container,
  codec: t.Type<T>,
): CosmosStore<T> => ({
  bulkFetch: bulkFetch(container, codec),
  bulkPatch: bulkPatch(container),
  delete: deleteItem(container),
  fetch: fetch(container, codec),
  getGroupUnboundedServicesByIds: getGroupUnboundedServicesByIds(container),
  getServiceIdsByGroupIds: getServiceIdsByGroupIds(container),
  patch: patch(container, codec),
  save: save(container),
});
