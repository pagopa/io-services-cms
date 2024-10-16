import { EventData, EventHubProducerClient } from "@azure/event-hubs";
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

export const mapToEvents = <S>(
  items: readonly S[],
  dataMapper: (item: S) => EventData,
): EventData[] => items.map((item) => dataMapper(item));

export const genericIngestionHandler =
  <S>(
    producer: EventHubProducerClient,
    formatter: (item: S) => EventData,
  ): RTE.ReaderTaskEither<
    { items: readonly S[] },
    never,
    IngestionResults<S>[]
  > =>
  ({ items }) =>
    pipe(
      mapToEvents(items, formatter),
      TE.right,
      TE.chainW((events) =>
        pipe(
          TE.tryCatch(() => producer.sendBatch(events), E.toError),
          TE.map(() => [noAction]),
        ),
      ),
      TE.orElseW((_) =>
        pipe(
          items.map((item) => ({
            ingestionError: item,
          })),
          TE.right,
        ),
      ),
    );
