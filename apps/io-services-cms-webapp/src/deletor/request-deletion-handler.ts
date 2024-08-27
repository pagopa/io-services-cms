import { Context } from "@azure/functions";
import { Queue, ServicePublication } from "@io-services-cms/models";
import * as T from "fp-ts/lib/Task";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { Json } from "io-ts-types";
import { withJsonInput } from "../lib/azure/misc";
import { QueuePermanentError } from "../utils/errors";
import { parseIncomingMessage } from "../utils/queue-utils";

export const handleQueueItem = (
  context: Context,
  queueItem: Json,
  fsmPublicationClient: ServicePublication.FsmClient
) =>
  pipe(
    queueItem,
    parseIncomingMessage(Queue.RequestDeletionItem),
    TE.fromEither,
    TE.chainW(({ id }) =>
      pipe(
        fsmPublicationClient.getStore().delete(id),
        TE.map((_) => void 0)
      )
    ),
    TE.getOrElse((e) => {
      if (e instanceof QueuePermanentError) {
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
