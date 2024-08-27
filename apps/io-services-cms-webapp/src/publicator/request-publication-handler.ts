import { Context } from "@azure/functions";
import {
  FsmItemNotFoundError,
  Queue,
  ServicePublication,
} from "@io-services-cms/models";
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
    parseIncomingMessage(Queue.RequestPublicationItem),
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
        } else if (e instanceof QueuePermanentError) {
          context.log.error(`Permanent error: ${e.message}`);
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
