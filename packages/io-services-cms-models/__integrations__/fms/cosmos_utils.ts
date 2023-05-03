/**
 * Insert fake data into CosmosDB database emulator.
 */
import { Container, CosmosClient, Database } from "@azure/cosmos";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { pipe } from "fp-ts/lib/function";
import * as E from "fp-ts/lib/Either";

const getRequiredStringEnv = (k: string): NonEmptyString =>
  pipe(
    process.env[k],
    NonEmptyString.decode,
    E.getOrElseW((_) => {
      throw new Error(`${k} must be defined and non-empty`);
    })
  );

const endpoint = getRequiredStringEnv("COSMOSDB_URI");
const key = getRequiredStringEnv("COSMOSDB_KEY");

const client = new CosmosClient({ endpoint, key });

const makeRandomName = (): string => {
  const result: string[] = [];
  const characters = "abcdefghijklmnopqrstuvwxyz";
  const charactersLength = characters.length;
  // eslint-disable-next-line functional/no-let
  for (let i = 0; i < 12; i++) {
    // eslint-disable-next-line functional/immutable-data
    result.push(
      characters.charAt(Math.floor(Math.random() * charactersLength))
    );
  }
  return `test-${result.join("")}`;
};

export type CosmosContext = {
  database: Database;
  container: Container;
};

export const createContext = async (): Promise<CosmosContext> => {
  const containerName = makeRandomName();
  const databaseName = makeRandomName();

  // setup
  const database = await client.databases
    .createIfNotExists({ id: databaseName })
    .then((r) => r.database);
  const container = await database.containers
    .createIfNotExists({
      id: containerName,
      partitionKey: `/id`,
    })
    .then((r) => r.container);

  return { database, container };
};

export const destroyContext = async ({
  container,
  database,
}: CosmosContext) => {
  await container.delete();
  await database.delete();
};
