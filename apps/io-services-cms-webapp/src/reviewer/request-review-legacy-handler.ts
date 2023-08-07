/**
 * This function is triggered by messages in the "request-review-legacy" queue
 *
 * On this queue there are messages that are written by the legacy system when an user requests a service review,
 * we need to intercept those events in order to keep alligned io-services-cms and the legacy service.
 *
 * It does the following:
 * - it fetches the service from the service lifecycle cosmosDB container
 * - if the service is not found, it returns an error
 * - if the service is found, it sets the state to submitted and creates a new entry in the service review legacy pg table in order to keep track of the request
 *   and update the legacy service when the review is completed
 */

import { Context } from "@azure/functions";
import { Queue, ServiceLifecycle } from "@io-services-cms/models";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import { Json } from "io-ts-types";
import { IConfig } from "../config";
import { withJsonInput } from "../lib/azure/misc";
import { isUserEnabledForRequestReviewLegacy } from "../utils/feature-flag-handler";
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
  dao: ServiceReviewDao,
  config: IConfig
) =>
  pipe(
    queueItem,
    parseIncomingMessage,
    TE.fromEither,
    TE.chain((requestReviewLegacy) =>
      pipe(
        isUserEnabledForRequestReviewLegacy(
          config,
          requestReviewLegacy.apimUserId
        )
          ? processItem(fsmLifecycleClient, dao, requestReviewLegacy)
          : TE.right(void 0)
      )
    ),
    TE.getOrElse((e) => {
      throw e;
    })
  );

const processItem = (
  fsmLifecycleClient: ServiceLifecycle.FsmClient,
  dao: ServiceReviewDao,
  requestReviewLegacy: Queue.RequestReviewLegacyItem
) =>
  pipe(
    requestReviewLegacy.serviceId,
    fsmLifecycleClient.fetch,
    TE.chain(
      flow(
        O.fold(
          () =>
            TE.left(
              new Error(`Service ${requestReviewLegacy.serviceId} not found `)
            ),
          flow(
            // 1. set to submitted the service doing an override
            setToSubmitted,
            (submittedService) =>
              fsmLifecycleClient.override(submittedService.id, submittedService)
          )
        )
      )
    ),
    // 2. create entry in service review legacy table
    TE.chain((_) =>
      pipe(
        dao.insert({
          service_id: requestReviewLegacy.serviceId,
          service_version: new Date().getTime().toString() as NonEmptyString,
          ticket_id: requestReviewLegacy.ticketId,
          ticket_key: requestReviewLegacy.ticketKey,
          status: "PENDING",
          extra_data: {},
        }),
        TE.mapLeft(E.toError),
        TE.map((_) => void 0)
      )
    )
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
  dao: ServiceReviewDao,
  config: IConfig
): ReturnType<typeof withJsonInput> =>
  withJsonInput((context, queueItem) =>
    handleQueueItem(context, queueItem, fsmLifecycleClient, dao, config)()
  );
