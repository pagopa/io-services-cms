import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as A from "fp-ts/Array";
import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import { flow, pipe } from "fp-ts/lib/function";
import * as t from "io-ts";
import { Decoder } from "io-ts";
import { date } from "io-ts-types";
import knexBase from "knex";
import { DatabaseError, Pool } from "pg";

import { TopicPostgreSqlConfig } from "../config";
import { getPool, queryDataTable } from "../lib/clients/pg-client";

const knex = knexBase({
  client: "pg",
});

export type ServiceTopicRowDataTable = t.TypeOf<
  typeof ServiceTopicRowDataTable
>;
export const ServiceTopicRowDataTable = t.type({
  id: t.number,
  name: NonEmptyString,
});

export type AllServiceTopicRowDataTable = t.TypeOf<
  typeof AllServiceTopicRowDataTable
>;
export const AllServiceTopicRowDataTable = t.type({
  deleted: t.boolean,
  id: t.number,
  modified_at: date,
  name: NonEmptyString,
});

const createExistsByIdSql = (
  { TOPIC_DB_SCHEMA, TOPIC_DB_TABLE }: TopicPostgreSqlConfig,
  id: number,
): string =>
  knex
    .withSchema(TOPIC_DB_SCHEMA)
    .table(TOPIC_DB_TABLE)
    .select(knex.raw("1"))
    .where("id", id)
    .andWhere("deleted", false)
    .toQuery();

const existsById =
  (pool: Pool, dbConfig: TopicPostgreSqlConfig) =>
  (id: number): TE.TaskEither<DatabaseError, boolean> =>
    pipe(
      createExistsByIdSql(dbConfig, id),
      queryDataTable(pool),
      TE.map((queryResult) => queryResult.rowCount > 0),
    );

const createFindByIdSql = (
  { TOPIC_DB_SCHEMA, TOPIC_DB_TABLE }: TopicPostgreSqlConfig,
  id: number,
): string =>
  knex
    .withSchema(TOPIC_DB_SCHEMA)
    .table(TOPIC_DB_TABLE)
    .select("id", "name")
    .where("id", id)
    .andWhere("deleted", false)
    .limit(1) // TODO: check useless
    .toQuery();

const findById =
  (pool: Pool, dbConfig: TopicPostgreSqlConfig) =>
  (
    id: number,
  ): TE.TaskEither<DatabaseError | Error, O.Option<ServiceTopicRowDataTable>> => // FIXME: create a specific ValidationError
    pipe(
      createFindByIdSql(dbConfig, id),
      queryDataTable(pool),
      TE.map(
        flow(
          O.fromPredicate((queryResult) => queryResult.rowCount === 1),
          O.map((queryResult) => queryResult.rows[0]),
        ),
      ),
      TE.chain(
        flow(
          O.fold(
            () => TE.right(O.none),
            flow(
              ServiceTopicRowDataTable.decode,
              E.bimap(flow(readableReport, E.toError), O.some),
              TE.fromEither,
            ),
          ),
        ),
      ),
    );

const createSelectNotDeletedTopicsSql = ({
  TOPIC_DB_SCHEMA,
  TOPIC_DB_TABLE,
}: TopicPostgreSqlConfig): string =>
  knex
    .withSchema(TOPIC_DB_SCHEMA)
    .table(TOPIC_DB_TABLE)
    .select("id", "name")
    .where("deleted", false)
    .toQuery();

const createSelectTopicsSql = ({
  TOPIC_DB_SCHEMA,
  TOPIC_DB_TABLE,
}: TopicPostgreSqlConfig): string =>
  knex.withSchema(TOPIC_DB_SCHEMA).table(TOPIC_DB_TABLE).select("*").toQuery();

const findTopics =
  <T>(
    pool: Pool,
    dbConfig: TopicPostgreSqlConfig,
    codec: Decoder<unknown, T>,
    query: (dbConfig: TopicPostgreSqlConfig) => string,
  ) =>
  (): TE.TaskEither<DatabaseError | Error, T[]> =>
    pipe(
      query(dbConfig),
      queryDataTable(pool),
      TE.map((queryResult) => queryResult.rows),
      TE.chain(
        flow(
          A.traverse(E.Applicative)(codec.decode),
          E.mapLeft(flow(readableReport, E.toError)),
          TE.fromEither,
        ),
      ),
    );

let dao: ServiceTopicDao;
export const getDao = (dbConfig: TopicPostgreSqlConfig) => {
  if (!dao) {
    dao = pipe(getPool(dbConfig), (pool) => ({
      existsById: existsById(pool, dbConfig),
      findAllNotDeletedTopics: findTopics(
        pool,
        dbConfig,
        ServiceTopicRowDataTable,
        createSelectNotDeletedTopicsSql,
      ),
      findAllTopics: findTopics(
        pool,
        dbConfig,
        AllServiceTopicRowDataTable,
        createSelectTopicsSql,
      ),
      findById: findById(pool, dbConfig),
    }));
  }
  return dao;
};

export interface ServiceTopicDao {
  existsById: ReturnType<typeof existsById>;
  findAllNotDeletedTopics: ReturnType<
    typeof findTopics<ServiceTopicRowDataTable>
  >;
  findAllTopics: ReturnType<typeof findTopics<AllServiceTopicRowDataTable>>;
  findById: ReturnType<typeof findById>;
}
