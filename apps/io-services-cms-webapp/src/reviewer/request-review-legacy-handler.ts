import { Context } from "@azure/functions";
import { Queue, ServiceLifecycle } from "@io-services-cms/models";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";
import { flow, pipe } from "fp-ts/lib/function";
import { Json } from "io-ts-types";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { withJsonInput } from "../lib/azure/misc";
import { SYNC_FROM_LEGACY } from "../utils/synchronizer";
import { ServiceReviewDao } from "../utils/service-review-dao";

const parseIncomingMessage = (
  queueItem: Json
): E.Either<Error, Queue.RequestReviewLegacyItem> =>
  pipe(
    queueItem,
    Queue.RequestReviewLegacyItem.decode,
    E.mapLeft(flow(readableReport, (_) => new Error(_)))
  );

export const handleQueueItem = (
  context: Context,
  queueItem: Json,
  fsmLifecycleClient: ServiceLifecycle.FsmClient,
  dao: ServiceReviewDao
) =>
  pipe(
    queueItem,
    parseIncomingMessage,
    E.mapLeft((_) => new Error("Error while parsing incoming message")), // TODO: map as _permanent_ error
    TE.fromEither,
    TE.map((requestReviewLegacy) => {
      // execute operations
      pipe(
        requestReviewLegacy.serviceId,
        fsmLifecycleClient.fetch,
        TE.chainW(
          flow(
            O.foldW(
              () =>
                TE.left(
                  new Error(
                    `Service ${requestReviewLegacy.serviceId} not found `
                  )
                ),
              flow(
                // 1. set to submitted the service doing an override
                setToSubmitted,
                (submittedService) =>
                  fsmLifecycleClient.override(
                    submittedService.id,
                    submittedService
                  )
              )
            )
          )
        ),
        // 2. create entry in service review legacy table
        TE.chain((_) => createLegacyReviewEntry(requestReviewLegacy, dao)),
        TE.bimap(
          (err) => {
            context.log.error(
              `[RequestReviewLegacyHandler] - Item ${requestReviewLegacy.serviceId} failed for reason ${err.message}`
            );
            return err;
          },
          (_) => {
            context.log.info(
              `[RequestReviewLegacyHandler] - Item ${requestReviewLegacy.serviceId} processed`
            );
            return void 0;
          }
        )
      );
    }),
    TE.getOrElse((e) => {
      throw e;
    })
  );

const setToSubmitted = (
  service: ServiceLifecycle.ItemType
): ServiceLifecycle.ItemType => ({
  ...service,
  fsm: {
    ...service.fsm,
    state: "submitted",
    lastTransition: SYNC_FROM_LEGACY,
  },
});
const createLegacyReviewEntry = (
  requestReviewLegacy: Queue.RequestReviewLegacyItem,
  dao: ServiceReviewDao
) =>
  pipe(
    {
      service_id: requestReviewLegacy.serviceId,
      service_version: "0.0.1" as NonEmptyString, // TODO: how to value this field?
      ticket_id: "" as NonEmptyString, // TODO: how to value this field?
      ticket_key: requestReviewLegacy.ticketKey,
      status: "PENDING",
    },
    dao.insert,
    TE.map((_) => void 0),
    TE.mapLeft((e) => new Error(`Error while inserting legacy review: ${e}`))
  );

export const createRequestReviewLegacyHandler = (
  fsmLifecycleClient: ServiceLifecycle.FsmClient,
  dao: ServiceReviewDao
): ReturnType<typeof withJsonInput> =>
  withJsonInput((context, queueItem) =>
    handleQueueItem(context, queueItem, fsmLifecycleClient, dao)()
  );
