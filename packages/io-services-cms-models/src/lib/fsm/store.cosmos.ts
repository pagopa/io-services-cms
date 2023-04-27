import { Container } from "@azure/cosmos";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import * as O from "fp-ts/Option";
import * as t from "io-ts";
import { pipe } from "fp-ts/lib/function";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { FSMStore, WithState } from "./types";

type CosmosStore<T extends WithState<string, Record<string, unknown>>> =
  FSMStore<T>;

export const createCosmosStore = <
  T extends WithState<string, Record<string, unknown>>
>(
  container: Container,
  codec: t.Type<T>
): CosmosStore<T> => {
  const fetch = (id: string) =>
    pipe(
      // fetch the item by its id
      TE.tryCatch(
        () => container.item(id).read(),
        (err) =>
          new Error(
            `Failed to read item id#${id} from database, ${
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
            `Failed to save item id#${id} from database, ${
              E.toError(err).message
            }`
          )
      ),
      TE.map((_) => value)
    );

  return { fetch, save };
};
