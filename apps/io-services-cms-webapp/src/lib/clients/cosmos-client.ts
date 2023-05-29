import { pipe } from "fp-ts/lib/function";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import * as t from "io-ts";
import { Container } from "@azure/cosmos";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";

export type CosmosClient<T> = {
  readonly fetch: (id: string) => TE.TaskEither<Error, O.Option<T>>;
  readonly save: (id: string, value: T) => TE.TaskEither<Error, T>;
};

export const cosmosClient = <T>(
  container: Container,
  codec: t.Type<T>
): CosmosClient<T> => {
  const fetch = (id: string) =>
    pipe(
      // fetch the item by its id
      TE.tryCatch(
        () => container.item(id, id).read(),
        (err) =>
          new Error(
            `Failed to read item id#${id} from container ${container.id}, ${
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
              rr.resource,
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

  const save = (id: string, value: T) =>
    pipe(
      TE.tryCatch(
        () => container.items.upsert({ ...value, id }),
        (err) =>
          new Error(
            `Failed to save item id#${id} on container ${container.id}, ${
              E.toError(err).message
            }`
          )
      ),
      TE.map((_) => value)
    );

  return { fetch, save };
};
