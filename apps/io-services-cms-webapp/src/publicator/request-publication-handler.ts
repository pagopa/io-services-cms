import { Context } from "@azure/functions";
import {
  FsmItemNotFoundError,
  Queue,
  ServicePublication,
} from "@io-services-cms/models";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import * as E from "fp-ts/lib/Either";
import * as T from "fp-ts/lib/Task";
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

export const handleQueueItem = (
  context: Context,
  queueItem: Json,
  fsmPublicationClient: ServicePublication.FsmClient
) =>
  pipe(
    queueItem,
    parseIncomingMessage,
    E.mapLeft((_) => new Error("Error while parsing incoming message")), // TODO: map as _permanent_ error
    TE.fromEither,
    TE.chainW((item) =>
      fsmPublicationClient.release(
        item.id,
        {
          id: item.id,
          data: item.data,
        },
        item.autoPublish
      )
    ),
    TE.fold(
      (e) => {
        if (e instanceof FsmItemNotFoundError) {
          context.log.info(
            `Operation Completed no more action needed => ${e.message}`,
            e
          );
          return T.of(void 0);
        } else {
          throw e;
        }
      },
      (_) => T.of(void 0)
    )
  );

export const createRequestPublicationHandler = (
  fsmPublicationClient: ServicePublication.FsmClient
): ReturnType<typeof withJsonInput> =>
  withJsonInput((context, queueItem) =>
    handleQueueItem(context, queueItem, fsmPublicationClient)()
  );
