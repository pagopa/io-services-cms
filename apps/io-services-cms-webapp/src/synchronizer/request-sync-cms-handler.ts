import { Context } from "@azure/functions";
import {
  Queue,
  ServiceLifecycle,
  ServicePublication,
} from "@io-services-cms/models";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import { Json } from "io-ts-types";
import { withJsonInput } from "../lib/azure/misc";

const parseIncomingMessage = (
  queueItem: Json
): E.Either<Error, Queue.RequestSyncCmsItem> =>
  pipe(
    queueItem,
    Queue.RequestSyncCmsItem.decode,
    E.mapLeft(flow(readableReport, E.toError))
  );

const toServiceLifecycle = (
  state: ServiceLifecycle.ItemType["fsm"]["state"],
  { id, data }: Queue.RequestSyncCmsItem
): ServiceLifecycle.ItemType => ({
  id,
  data,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fsm: { state: state as any, lastTransition: "from Legacy" },
});

const toServicePublication = (
  state: ServicePublication.ItemType["fsm"]["state"],
  { id, data }: Queue.RequestSyncCmsItem
): // eslint-disable-next-line sonarjs/no-identical-functions
ServicePublication.ItemType => ({
  id,
  data,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fsm: { state: state as any, lastTransition: "from Legacy" },
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
    TE.chain((item) => {
      switch (item.kind) {
        case "LifecycleItemType":
          return pipe(
            toServiceLifecycle(item.fsm.state, item),
            (serviceLifecycle) =>
              fsmLifecycleClient.override(
                serviceLifecycle.id,
                serviceLifecycle
              ),
            TE.map((_) => void 0)
          );
        case "PublicationItemType":
          return pipe(
            toServicePublication(item.fsm.state, item),
            (servicePublication) =>
              fsmPublicationClient.override(
                servicePublication.id,
                servicePublication
              ),
            TE.map((_) => void 0)
          );
        default:
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const _: never = item;
          throw new Error(`should not have executed this with ${item}`);
      }
    }),
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
