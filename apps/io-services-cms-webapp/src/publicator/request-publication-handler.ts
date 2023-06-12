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
            : fsmPublicationClient.override(service.id, publicationArgs)
      )
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
