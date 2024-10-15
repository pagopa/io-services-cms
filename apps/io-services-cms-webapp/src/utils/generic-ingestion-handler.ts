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

export const mapToEvents = <S, R>(
  items: readonly S[],
  dataMapper: (item: S) => R,
): EventData[] =>
  items.map((item) => ({
    body: dataMapper(item),
    contentType: "application/json",
  }));

// export const genericIngestionHandler =
//   <S, R>(producer: EventHubProducerClient, dataMapper: (item: S) => R) =>
//   (items: readonly S[]): TE.TaskEither<never, IngestionResults<S>[]> =>
//     pipe(
//       mapToEvents(items, dataMapper),
//       TE.right,
//       TE.chainW((events) =>
//         pipe(
//           TE.tryCatch(() => producer.sendBatch(events), E.toError),
//           TE.map(() => items.map(() => noAction)),
//           TE.mapLeft((_) =>
//             items.map((item) => ({
//               ingestionError: item,
//             })),
//           ),
//         ),
//       ),
//       TE.orElseW((_) =>
//         pipe(
//           items.map((item) => ({
//             ingestionError: item,
//           })),
//           TE.right,
//         ),
//       ),
//     );

export const genericIngestionHandler =
  <S, R>(
    producer: EventHubProducerClient,
    dataMapper: (item: S) => R,
  ): RTE.ReaderTaskEither<
    { items: readonly S[] },
    never,
    IngestionResults<R>[]
  > =>
  ({ items }) =>
    pipe(
      mapToEvents(items, dataMapper),
      TE.right,
      TE.chainW((events) =>
        pipe(
          TE.tryCatch(() => producer.sendBatch(events), E.toError),
          TE.map(() => items.map(() => noAction)),
          TE.mapLeft((_) =>
            items.map((item) => ({
              ingestionError: item,
            })),
          ),
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
