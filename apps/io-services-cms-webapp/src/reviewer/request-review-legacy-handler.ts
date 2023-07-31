import { Context } from "@azure/functions";
import { Queue, ServiceLifecycle } from "@io-services-cms/models";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import { Json } from "io-ts-types";
import { withJsonInput } from "../lib/azure/misc";
import { ServiceReviewDao } from "../utils/service-review-dao";
import { SYNC_FROM_LEGACY } from "../utils/synchronizer";

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
    TE.fromEither,
    TE.chain((requestReviewLegacy) =>
      pipe(
        requestReviewLegacy.serviceId,
        fsmLifecycleClient.fetch,
        TE.chain((service) =>
          pipe(
            service,
            O.fold(
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
        TE.chain((_) =>
          pipe(
            dao.insert({
              service_id: requestReviewLegacy.serviceId,
              service_version: "0.0.1" as NonEmptyString, // TODO: how to value this field?
              ticket_id: "" as NonEmptyString, // TODO: how to value this field?
              ticket_key: requestReviewLegacy.ticketKey,
              status: "PENDING",
              extra_data: {},
            }),
            TE.mapLeft(E.toError)
          )
        )
      )
    ),
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

export const createRequestReviewLegacyHandler = (
  fsmLifecycleClient: ServiceLifecycle.FsmClient,
  dao: ServiceReviewDao
): ReturnType<typeof withJsonInput> =>
  withJsonInput((context, queueItem) =>
    handleQueueItem(context, queueItem, fsmLifecycleClient, dao)()
  );
