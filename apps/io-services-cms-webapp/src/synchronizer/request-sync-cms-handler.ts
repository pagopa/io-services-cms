import { Context } from "@azure/functions";
import {
  Queue,
  ServiceLifecycle,
  ServicePublication,
} from "@io-services-cms/models";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as RA from "fp-ts/lib/ReadonlyArray";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import { Json } from "io-ts-types";
import { withJsonInput } from "../lib/azure/misc";
import { SYNC_FROM_LEGACY } from "../utils/synchronizer";

const parseIncomingMessage = (
  queueItem: Json
): E.Either<Error, Queue.RequestSyncCmsItems> =>
  pipe(
    queueItem,
    Queue.RequestSyncCmsItems.decode,
    E.mapLeft(flow(readableReport, E.toError))
  );

const toServiceLifecycle =
  (fsmLifecycleClient: ServiceLifecycle.FsmClient) =>
  (
    state: ServiceLifecycle.ItemType["fsm"]["state"],
    { id, data }: Queue.RequestSyncCmsItem
  ) =>
    pipe(
      id,
      fsmLifecycleClient.fetch,
      TE.chainW(
        O.fold(
          () => TE.right(data),
          (currentServiceLifecycle) =>
            TE.right({
              ...data,
              metadata: {
                ...data.metadata,
                topic_id: currentServiceLifecycle.data.metadata.topic_id,
              },
            })
        )
      ),
      TE.map((lifecycleData) => ({
        id,
        data: lifecycleData,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fsm: { state: state as any, lastTransition: SYNC_FROM_LEGACY },
      }))
    );

const toServicePublication =
  (fsmPublicationClient: ServicePublication.FsmClient) =>
  (
    state: ServicePublication.ItemType["fsm"]["state"],
    { id, data }: Queue.RequestSyncCmsItem
  ) =>
    pipe(
      id,
      fsmPublicationClient.getStore().fetch,
      TE.chainW(
        O.fold(
          () => TE.right(data),
          (currentServicePublication) =>
            TE.right({
              ...data,
              metadata: {
                ...data.metadata,
                topic_id: currentServicePublication.data.metadata.topic_id,
              },
            })
        )
      ),
      TE.map((publicationData) => ({
        id,
        data: publicationData,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fsm: { state: state as any, lastTransition: SYNC_FROM_LEGACY },
      }))
    );

export const handleQueueItem = (
  _context: Context,
  queueItem: Json,
  fsmLifecycleClient: ServiceLifecycle.FsmClient,
  fsmPublicationClient: ServicePublication.FsmClient
) =>
  pipe(
    queueItem,
    parseIncomingMessage,
    E.mapLeft(
      (err) =>
        new Error(
          `Error while parsing incoming message, the reason was => ${err.message}`
        )
    ), // TODO: map as _permanent_ error
    TE.fromEither,
    TE.chainW((items) =>
      pipe(
        items,
        RA.filter((item) => item.kind === "LifecycleItemType"),
        RA.traverse(TE.ApplicativePar)((item) =>
          pipe(
            toServiceLifecycle(fsmLifecycleClient)(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              item.fsm.state as any,
              item
            ),

            TE.chain((serviceLifecycle) =>
              fsmLifecycleClient.override(serviceLifecycle.id, serviceLifecycle)
            ),
            TE.map((_) => void 0)
          )
        ),
        TE.chainW(() =>
          pipe(
            items,
            RA.filter((item) => item.kind === "PublicationItemType"),
            RA.traverse(TE.ApplicativePar)((item) =>
              pipe(
                toServicePublication(fsmPublicationClient)(
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  item.fsm.state as any,
                  item
                ),
                TE.chain((servicePublication) =>
                  fsmPublicationClient.override(
                    servicePublication.id,
                    servicePublication
                  )
                ),
                TE.map((_) => void 0)
              )
            )
          )
        )
      )
    ),
    TE.getOrElse((e) => {
      throw e;
    })
  );

export const createRequestSyncCmsHandler = (
  fsmLifecycleClient: ServiceLifecycle.FsmClient,
  fsmPublicationClient: ServicePublication.FsmClient
): ReturnType<typeof withJsonInput> =>
  withJsonInput((context, queueItem) =>
    handleQueueItem(
      context,
      queueItem,
      fsmLifecycleClient,
      fsmPublicationClient
    )()
  );
