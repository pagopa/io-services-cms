import { Queue, ServicePublication } from "@io-services-cms/models";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import { Json } from "io-ts-types";
import { Context } from "@azure/functions";
import { withJsonInput } from "../lib/azure/misc";

const parseIncomingMessage = (
  queueItem: Json
): E.Either<Error, Queue.RequestPublicationItem> =>
  pipe(
    queueItem,
    Queue.RequestPublicationItem.decode,
    E.mapLeft(flow(readableReport, (_) => new Error(_)))
  );

export const handleQueueItem = (
  context: Context,
  queueItem: Json,
  fsmPublicationClient: ServicePublication.FsmClient
) =>
  pipe(
    queueItem,
    parseIncomingMessage,
    TE.fromEither,
    TE.mapLeft((_) => new Error("Error while parsing incoming message")),
    TE.chainW((service) =>
      service.autoPublish
        ? fsmPublicationClient.publish(service.id, {
            data: {
              id: service.id,
              data: service.data,
            },
          })
        : fsmPublicationClient.override(service.id, {
            data: {
              id: service.id,
              data: service.data,
            },
          })
    ),
    TE.getOrElse((e) => {
      throw e;
    })
  );

export const createRequestPublicationHandler = (
  fsmPublicationClient: ServicePublication.FsmClient
): ReturnType<typeof withJsonInput> =>
  withJsonInput((context, queueItem) =>
    handleQueueItem(context, queueItem, fsmPublicationClient)()
  );
