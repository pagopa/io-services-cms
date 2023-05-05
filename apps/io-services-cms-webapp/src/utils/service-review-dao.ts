import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import * as t from "io-ts";
import knexBase from "knex";
import { DatabaseError, Pool, QueryResult } from "pg";
import { PostgreSqlConfig } from "../config";
import { createCursor, getPool, queryDataTable } from "../pg-client";

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
    extra_data: NonEmptyString, // TODO: how to type a generic object/json
  }),
]);

const createInsertSql = (
  { REVIEWER_DB_SCHEMA, REVIEWER_DB_TABLE }: PostgreSqlConfig,
  data: ServiceReviewRowDataTable
): string =>
  knex
    .withSchema(REVIEWER_DB_SCHEMA)
    .table(REVIEWER_DB_TABLE)
    .insert(data)
    .toQuery();

const insert =
  (pool: Pool, dbConfig: PostgreSqlConfig) =>
  (
    data: ServiceReviewRowDataTable
  ): TE.TaskEither<DatabaseError, QueryResult> =>
    pipe(createInsertSql(dbConfig, data), queryDataTable(pool));

const createReadSql = ({
  REVIEWER_DB_SCHEMA,
  REVIEWER_DB_TABLE,
}: PostgreSqlConfig): string =>
  knex
    .withSchema(REVIEWER_DB_SCHEMA)
    .table(REVIEWER_DB_TABLE)
    .where("status", "PENDING")
    .toQuery();

const executeOnPending =
  (pool: Pool, dbConfig: PostgreSqlConfig) =>
  (
    fn: (items: ServiceReviewRowDataTable[]) => TE.TaskEither<Error, void>
  ): TE.TaskEither<Error, void> =>
    pipe(dbConfig, createReadSql, (sql) =>
      TE.tryCatch(async () => {
        const poolClient = await pool.connect();
        const cursor = createCursor(poolClient)(sql);
        // eslint-disable-next-line functional/no-let
        let length: number;
        do {
          const rows = await cursor.read(dbConfig.REVIEWER_DB_READ_MAX_ROW);
          length = rows.length;
          const handler = pipe(
            rows,
            t.array(ServiceReviewRowDataTable).decode,
            E.mapLeft(E.toError),
            TE.fromEither,
            TE.chain(fn)
          );
          await handler(); // TODO: manage error (at least write a log)
        } while (length > 0);
        poolClient.release();
      }, E.toError)
    );

export const getDao = (dbConfig: PostgreSqlConfig) =>
  pipe(getPool(dbConfig), (pool) => ({
    insert: insert(pool, dbConfig),
    executeOnPending: executeOnPending(pool, dbConfig),
  }));
