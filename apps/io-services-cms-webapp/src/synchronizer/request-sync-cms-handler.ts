import { Context } from "@azure/functions";
import {
  Queue,
  ServiceLifecycle,
  ServicePublication,
} from "@io-services-cms/models";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import * as E from "fp-ts/lib/Either";
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

const toServiceLifecycle = (
  state: ServiceLifecycle.ItemType["fsm"]["state"],
  { id, data }: Queue.RequestSyncCmsItem
): ServiceLifecycle.ItemType => ({
  id,
  data,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fsm: { state: state as any, lastTransition: SYNC_FROM_LEGACY },
});

const toServicePublication = (
  state: ServicePublication.ItemType["fsm"]["state"],
  { id, data }: Queue.RequestSyncCmsItem
): // eslint-disable-next-line sonarjs/no-identical-functions
ServicePublication.ItemType => ({
  id,
  data,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fsm: { state: state as any, lastTransition: SYNC_FROM_LEGACY },
});

export const handleQueueItem = (
  _context: Context,
  queueItem: Json,
  fsmLifecycleClient: ServiceLifecycle.FsmClient,
  fsmPublicationClient: ServicePublication.FsmClient
) =>
  pipe(
    queueItem,
    parseIncomingMessage,
    E.mapLeft((_) => new Error("Error while parsing incoming message")), // TODO: map as _permanent_ error
    TE.fromEither,
    TE.chainW((items) =>
      pipe(
        items,
        RA.filter((item) => item.kind === "LifecycleItemType"),
        RA.traverse(TE.ApplicativePar)((item) =>
          pipe(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            toServiceLifecycle(item.fsm.state as any, item),
            (serviceLifecycle) =>
              fsmLifecycleClient.override(
                serviceLifecycle.id,
                serviceLifecycle
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
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                toServicePublication(item.fsm.state as any, item),
                (servicePublication) =>
                  fsmPublicationClient.override(
                    servicePublication.id,
                    servicePublication
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
