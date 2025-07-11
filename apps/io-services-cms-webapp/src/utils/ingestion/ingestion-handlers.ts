import { EventData, EventHubProducerClient } from "@azure/event-hubs";
import * as A from "fp-ts/lib/Array";
import * as E from "fp-ts/lib/Either";
import * as RE from "fp-ts/lib/ReaderEither";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as T from "fp-ts/lib/Task";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import * as t from "io-ts";

import { withJsonInput } from "../../lib/azure/misc";
import { QueuePermanentError } from "../errors";
import { parseIncomingMessage } from "../queue-utils";

type Actions = "ingestionError";

type IngestionSuccess = typeof noAction;
type Action<A extends Actions, B> = Record<A, B>;

type IngestionError<S> = Action<"ingestionError", S>;
export type IngestionResults<S> = IngestionError<S> | IngestionSuccess;

const noAction = {};

const noEnricher = <S, U extends S>(item: S) => TE.right(item as U);

export const toEvents =
  <S, U extends S>(
    formatter: RE.ReaderEither<U, Error, EventData>,
    enricher: RTE.ReaderTaskEither<S, Error, U> = noEnricher,
  ) =>
  (items: readonly S[]): TE.TaskEither<Error, EventData[]> =>
    pipe(
      [...items],
      A.traverse(TE.ApplicativeSeq)((item) =>
        pipe(item, enricher, TE.chainEitherK(formatter)),
      ),
    );

// CosmosDBTrigger
export const createIngestionCosmosDBTriggerHandler =
  <S, U extends S>(
    producer: EventHubProducerClient,
    formatter: RE.ReaderEither<U, Error, EventData>,
    enricher: RTE.ReaderTaskEither<S, Error, U> = noEnricher,
  ): RTE.ReaderTaskEither<
    { items: readonly S[] },
    never,
    IngestionResults<S>[]
  > =>
  ({ items }) =>
    pipe(
      items,
      toEvents(formatter, enricher), // format service to the specified avro format
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

// Blob Trigger
export const createIngestionBlobTriggerHandler =
  <S, U extends S>(
    producer: EventHubProducerClient,
    formatter: RE.ReaderEither<U, Error, EventData>,
    enricher: RTE.ReaderTaskEither<S, Error, U> = noEnricher,
  ): RTE.ReaderTaskEither<
    { items: readonly S[] },
    Error,
    IngestionResults<S>[]
  > =>
  ({ items }) =>
    pipe(
      items,
      toEvents(formatter, enricher), // format service to the specified avro format
      TE.chainW(
        (events) => TE.tryCatch(() => producer.sendBatch(events), E.toError), // send the formatted service to the eventhub
      ),
      TE.map(() => [noAction]), // return noAction if the sendBatch was successful
    );

// Retry QuqueTrigger
export const createIngestionRetryQueueTriggerHandler = <S, U extends S>(
  decoder: t.Decoder<unknown, S>, // parse the incoming message
  producer: EventHubProducerClient,
  formatter: (item: S) => E.Either<Error, EventData>, //TaskEither to support async enrichment
  enricher: RTE.ReaderTaskEither<S, Error, U> = noEnricher,
): ReturnType<typeof withJsonInput> =>
  withJsonInput((context, queueItem) =>
    pipe(
      queueItem,
      parseIncomingMessage(decoder),
      TE.fromEither,
      TE.chainW(enricher),
      TE.chainW(flow(formatter, TE.fromEither)),
      TE.chainW((event) =>
        TE.tryCatch(() => producer.sendBatch([event]), E.toError),
      ),
      TE.fold(
        (e) => {
          if (e instanceof QueuePermanentError) {
            context.log.error(`Permanent error: ${e.message}`);
            return T.of(void 0);
          } else {
            throw e; // this will be catched by the Azure Function runtime which will log the error and retry process the message again till the max retry count is reached
          }
        },
        (_) => T.of(void 0),
      ),
    )(),
  );
