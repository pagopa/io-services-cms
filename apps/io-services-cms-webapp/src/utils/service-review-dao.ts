/* eslint-disable no-console */
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import * as t from "io-ts";
import knexBase from "knex";
import { DatabaseError, Pool, QueryResult } from "pg";
import { ReviewerPostgreSqlConfig } from "../config";
import {
  createCursor,
  getPool,
  queryDataTable,
} from "../lib/clients/pg-client";

const knex = knexBase({
  client: "pg",
});

export type ServiceReviewRowDataTable = t.TypeOf<
  typeof ServiceReviewRowDataTable
>;
export const ServiceReviewRowDataTable = t.intersection([
  t.type({
    service_id: NonEmptyString,
    service_version: NonEmptyString,
    ticket_id: NonEmptyString,
    ticket_key: NonEmptyString,
    status: t.union([
      t.literal("PENDING"),
      t.literal("APPROVED"),
      t.literal("REJECTED"),
      t.literal("ABORTED"),
    ]),
  }),
  t.partial({
    extra_data: t.record(t.string, t.unknown),
  }),
]);

const createInsertSql = (
  { REVIEWER_DB_SCHEMA, REVIEWER_DB_TABLE }: ReviewerPostgreSqlConfig,
  data: ServiceReviewRowDataTable
): string =>
  knex
    .withSchema(REVIEWER_DB_SCHEMA)
    .table(REVIEWER_DB_TABLE)
    .insert(data)
    .toQuery();

const insert =
  (pool: Pool, dbConfig: ReviewerPostgreSqlConfig) =>
  (
    data: ServiceReviewRowDataTable
  ): TE.TaskEither<DatabaseError, QueryResult> =>
    pipe(createInsertSql(dbConfig, data), queryDataTable(pool));

const createReadSql = ({
  REVIEWER_DB_SCHEMA,
  REVIEWER_DB_TABLE,
}: ReviewerPostgreSqlConfig): string =>
  knex
    .withSchema(REVIEWER_DB_SCHEMA)
    .table(REVIEWER_DB_TABLE)
    .where("status", "PENDING")
    .toQuery();

const createUpdateStatusSql = (
  { REVIEWER_DB_SCHEMA, REVIEWER_DB_TABLE }: ReviewerPostgreSqlConfig,
  service: ServiceReviewRowDataTable
): string =>
  knex
    .withSchema(REVIEWER_DB_SCHEMA)
    .table(REVIEWER_DB_TABLE)
    .update("status", service.status)
    .where({
      service_id: service.service_id,
      service_version: service.service_version,
    })
    .toQuery();

const updateStatus =
  (pool: Pool, dbConfig: ReviewerPostgreSqlConfig) =>
  (
    data: ServiceReviewRowDataTable
  ): TE.TaskEither<DatabaseError, QueryResult> =>
    pipe(createUpdateStatusSql(dbConfig, data), queryDataTable(pool));

const buildPool = (pool: Pool) =>
  pipe(
    TE.tryCatch(
      () => pool.connect(),
      (err) =>
        new Error(
          `Error creating pool: ${
            err instanceof Error ? err.message : "unknown error"
          }`
        )
    )
  );

export const executeOnPending =
  (pool: Pool, dbConfig: ReviewerPostgreSqlConfig) =>
  (
    fn: (items: ServiceReviewRowDataTable[]) => TE.TaskEither<Error, void>
  ): TE.TaskEither<Error, void> =>
    pipe(
      dbConfig,
      createReadSql,
      TE.right,
      TE.chain((sqlStatement) =>
        pipe(
          pool,
          buildPool,
          TE.bindTo("poolClient"),
          TE.bindW("cursor", ({ poolClient }) =>
            pipe(
              E.tryCatch(
                () => createCursor(poolClient)(sqlStatement),
                E.toError
              ),
              TE.fromEither
            )
          ),
          TE.chainW(({ cursor, poolClient }) =>
            TE.tryCatch(async () => {
              try {
                // eslint-disable-next-line functional/no-let
                let length: number;
                do {
                  const rows = await cursor.read(
                    dbConfig.REVIEWER_DB_READ_MAX_ROW
                  );
                  length = rows.length;
                  const handler = pipe(
                    rows,
                    t.array(ServiceReviewRowDataTable).decode,
                    E.mapLeft(E.toError),
                    TE.fromEither,
                    TE.chain(fn)
                  );
                  await handler();
                } while (length > 0);
              } finally {
                cursor.close(() => {
                  poolClient.release();
                });
              }
            }, E.toError)
          )
        )
      )
    );

export const getDao = (dbConfig: ReviewerPostgreSqlConfig) =>
  pipe(getPool(dbConfig), (pool) => ({
    insert: insert(pool, dbConfig),
    executeOnPending: executeOnPending(pool, dbConfig),
    updateStatus: updateStatus(pool, dbConfig),
  }));

export type ServiceReviewDao = ReturnType<typeof getDao>;
