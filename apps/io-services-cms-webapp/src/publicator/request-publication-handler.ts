import { Queue, ServicePublication } from "@io-services-cms/models";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import { Json } from "io-ts-types";
import { withJsonInput } from "../lib/azure/misc";

const parseIncomingMessage = (
  queueItem: Json
): E.Either<Error, Queue.RequestPublicationItem> =>
  pipe(
    queueItem,
    Queue.RequestPublicationItem.decode,
    E.mapLeft(flow(readableReport, (_) => new Error(_)))
  );

export const createRequestPublicationHandler = (
  fsmPublicationClient: ServicePublication.FsmClient
): ReturnType<typeof withJsonInput> =>
  withJsonInput((_context, queueItem) =>
    pipe(
      queueItem,
      parseIncomingMessage,
      TE.fromEither,
      TE.mapLeft((_) => new Error("Error while parsing incoming message")),
      TE.chainW((service) =>
        service.autoPublish
          ? fsmPublicationClient.override(service.id, { data: service })
          : fsmPublicationClient.publish(service.id, { data: service })
      ),
      TE.getOrElse((e) => {
        throw e;
      })
    )()
  );
