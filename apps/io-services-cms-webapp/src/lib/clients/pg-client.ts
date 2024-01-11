import { toHealthProblems } from "@pagopa/io-functions-commons/dist/src/utils/healthcheck";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { DatabaseError, Pool, PoolClient, QueryResult } from "pg";
import Cursor from "pg-cursor";
import { PostgreSqlConfig } from "../../config";

// eslint-disable-next-line functional/no-let
let singletonPool: Pool;
export const getPool = (config: PostgreSqlConfig): Pool => {
  if (!singletonPool) {
    singletonPool = new Pool({
      database: config.REVIEWER_DB_NAME,
      host: config.REVIEWER_DB_HOST,
      idleTimeoutMillis: config.REVIEWER_DB_IDLE_TIMEOUT,
      max: 20,
      password: config.REVIEWER_DB_PASSWORD,
      port: config.REVIEWER_DB_PORT,
      ssl: true,
      user: config.REVIEWER_DB_USER,
      application_name: config.REVIEWER_DB_APP_NAME,
    });
  }
  return singletonPool;
};

export const createCursor =
  (pgClient: PoolClient) =>
  (sql: string): Cursor =>
    pgClient.query(new Cursor(sql));

export const queryDataTable =
  (pool: Pool) =>
  (query: string): TE.TaskEither<DatabaseError, QueryResult> =>
    TE.tryCatch(
      () => pool.query(query),
      (error) => error as DatabaseError
    );

export const healthcheck = (config: PostgreSqlConfig) =>
  pipe(
    "SELECT 1",
    queryDataTable(getPool(config)),
    TE.mapLeft(toHealthProblems("PostgresDB")),
    TE.map((_) => true as const)
  );
