import { Context } from "@azure/functions";
import { Queue, ServicePublication } from "@io-services-cms/models";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import * as E from "fp-ts/lib/Either";
import * as T from "fp-ts/lib/Task";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import { Json } from "io-ts-types";
import { withJsonInput } from "../lib/azure/misc";
import { PermanentError } from "../utils/errors";

const parseIncomingMessage = (
  queueItem: Json
): E.Either<Error, Queue.RequestDeletionItem> =>
  pipe(
    queueItem,
    Queue.RequestDeletionItem.decode,
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
    E.mapLeft(
      (e) => new PermanentError(`Error parsing incoming message: ${e.message}`)
    ),
    TE.fromEither,
    TE.chainW(({ id }) =>
      pipe(
        fsmPublicationClient.getStore().delete(id),
        TE.map((_) => void 0)
      )
    ),
    TE.getOrElse((e) => {
      if (e instanceof PermanentError) {
        context.log.error(`Permanent error: ${e.message}`);
        return T.of(void 0);
      }
      throw e;
    })
  );

export const createRequestDeletionHandler = (
  fsmPublicationClient: ServicePublication.FsmClient
): ReturnType<typeof withJsonInput> =>
  withJsonInput((context, queueItem) =>
    handleQueueItem(context, queueItem, fsmPublicationClient)()
  );
