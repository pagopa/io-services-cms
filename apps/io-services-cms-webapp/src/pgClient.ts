import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/function";
import * as t from "io-ts";
import { DatabaseError, Pool, PoolClient, QueryResult } from "pg";
import * as Cursor from "pg-cursor";
import { IDecodableConfigPostgreSQL } from "./config";

// eslint-disable-next-line functional/no-let
let singletonPool: Pool;
export const getPool = (config: IDecodableConfigPostgreSQL): Pool => {
  if (!singletonPool) {
    singletonPool = new Pool({
      database: config.DB_NAME,
      host: config.DB_HOST,
      idleTimeoutMillis: config.DB_IDLE_TIMEOUT,
      max: 20,
      password: config.DB_PASSWORD,
      port: config.DB_PORT,
      ssl: true,
      user: config.DB_USER,
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
    pipe(
      TE.tryCatch(
        () => pool.query(query),
        (error) => error as DatabaseError
      ),
      TE.mapLeft((e) => e)
    );

export const ResultRow = t.interface({
  count: t.string,
  status: t.string,
});
export type ResultRow = t.TypeOf<typeof ResultRow>;

export const ResultSet = t.interface({
  rowCount: t.number,
  rows: t.readonlyArray(ResultRow),
});
export type ResultSet = t.TypeOf<typeof ResultSet>;

// export default getPool;
