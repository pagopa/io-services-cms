import {
  Queue,
  ServicePublication,
  ServiceLifecycle,
} from "@io-services-cms/models";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import { Json } from "io-ts-types";
import { Context } from "@azure/functions";
import { withJsonInput } from "../lib/azure/misc";

// FIXME: copied from other file
const parseIncomingMessage = (
  queueItem: Json
): E.Either<Error, Queue.RequestPublicationItem> =>
  pipe(
    queueItem,
    Queue.RequestPublicationItem.decode,
    E.mapLeft(flow(readableReport, (_) => new Error(_)))
  );

// FIXME: copied from other file
export const handleQueueItem = (
  _context: Context,
  queueItem: Json,
  fsmLifecycleClient: ServiceLifecycle.FsmClient,
  fsmPublicationClient: ServicePublication.FsmClient
) =>
  pipe(
    queueItem,
    parseIncomingMessage,
    TE.fromEither,
    TE.mapLeft((_) => new Error("Error while parsing incoming message")), // TODO: map as _permanent_ error
    TE.chainW((service) =>
      pipe(
        {
          data: {
            id: service.id,
            data: service.data,
          },
        },
        (publicationArgs) =>
          service.autoPublish
            ? fsmPublicationClient.publish(service.id, publicationArgs)
            : fsmPublicationClient.release(service.id, publicationArgs)
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
