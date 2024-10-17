import { EventData, EventHubProducerClient } from "@azure/event-hubs";
import * as A from "fp-ts/lib/Array";
import * as E from "fp-ts/lib/Either";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

type Actions = "ingestionError";

type IngestionSuccess = typeof noAction;
type Action<A extends Actions, B> = Record<A, B>;

type IngestionError<S> = Action<"ingestionError", S>;
export type IngestionResults<S> = IngestionError<S> | IngestionSuccess;

const noAction = {};

// export const mapToEvents = <S>(
//   items: readonly S[],
//   dataMapper: (item: S) => EventData,
// ): EventData[] => items.map((item) => dataMapper(item));

export const toEvents =
  <S>(dataMapper: (item: S) => E.Either<Error, EventData>) =>
  (items: readonly S[]): E.Either<Error, EventData[]> =>
    pipe([...items], A.traverse(E.Applicative)(dataMapper));

export const genericIngestionHandler =
  <S>(
    producer: EventHubProducerClient,
    formatter: (item: S) => E.Either<Error, EventData>,
  ): RTE.ReaderTaskEither<
    { items: readonly S[] },
    never,
    IngestionResults<S>[]
  > =>
  ({ items }) =>
    pipe(
      items,
      toEvents(formatter), // format service to the specified avro format
      TE.fromEither,
      TE.chainW(
        (events) => TE.tryCatch(() => producer.sendBatch(events), E.toError), // send the formatted service to the eventhub
      ),
      TE.map(() => [noAction]), // return noAction if the sendBatch was successful
      TE.orElseW(
        (_) =>
          pipe(
            items.map((item) => ({
              ingestionError: item,
            })),
            TE.right,
          ), // return the items on IngestionError<S>, in order to be written in a DLQ and be reprocessed
      ),
    );
