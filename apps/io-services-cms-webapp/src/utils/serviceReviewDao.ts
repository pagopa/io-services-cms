import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/function";
import * as t from "io-ts";
import knexBase from "knex";
import { DatabaseError, Pool, QueryResult } from "pg";
import { IDecodableConfigPostgreSQL } from "../config";
import { getPool, queryDataTable } from "../pgClient";

const knex = knexBase({
  client: "pg",
});

export type ServiceReviewRowDataTable = t.TypeOf<
  typeof ServiceReviewRowDataTable
>;
export const ServiceReviewRowDataTable = t.type({
  serviceId: NonEmptyString,
  serviceVersion: NonEmptyString,
  ticketId: NonEmptyString, // TODO: save only the id or some other ticket related infos?
  status: t.union([
    t.literal("PENDING"),
    t.literal("APPROVED"),
    t.literal("REJECTED"),
    t.literal("ABORTED"),
  ]),
  extraData: NonEmptyString, // TODO: how to type a generic object/json
});

const createInsertSql = (
  { DB_SCHEMA, DB_TABLE }: IDecodableConfigPostgreSQL,
  data: ServiceReviewRowDataTable
): string => knex.withSchema(DB_SCHEMA).table(DB_TABLE).insert(data).toQuery();

const insert =
  (pool: Pool, dbConfig: IDecodableConfigPostgreSQL) =>
  (
    data: ServiceReviewRowDataTable
  ): TE.TaskEither<DatabaseError, QueryResult> =>
    pipe(createInsertSql(dbConfig, data), queryDataTable(pool));

const createReadSql = ({
  DB_SCHEMA,
  DB_TABLE,
}: IDecodableConfigPostgreSQL): string =>
  knex
    .withSchema(DB_SCHEMA)
    .table(DB_TABLE)
    .select(["serviceId", "serviceVersion", "status", "scope", "extraData"])
    .where("status", "PENDING")
    .toQuery();

const readPending =
  (pool: Pool, dbConfig: IDecodableConfigPostgreSQL) =>
  (): TE.TaskEither<DatabaseError, QueryResult> =>
    pipe(dbConfig, createReadSql, queryDataTable(pool));

export const getDao = (dbConfig: IDecodableConfigPostgreSQL) =>
  pipe(getPool(dbConfig), (pool) => ({
    insert: insert(pool, dbConfig),
    readPending: readPending(pool, dbConfig),
  }));
