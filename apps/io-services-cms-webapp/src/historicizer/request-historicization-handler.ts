import { Context } from "@azure/functions";
import {
  DateUtils,
  Queue,
  ServiceHistory,
  ServiceLifecycle,
  ServicePublication,
} from "@io-services-cms/models";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as T from "fp-ts/lib/Task";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { Json } from "io-ts-types";

import { withJsonInput } from "../lib/azure/misc";
import { QueuePermanentError } from "../utils/errors";
import { parseIncomingMessage } from "../utils/queue-utils";

// Method used in on-service-lifecycle-change.ts and on-service-publication-change.ts
// used to build the message to be sent to the request-historicization queue and processed by this handler
export const buildRequestHistoricizationQueueMessage = ({
  _etag,
  _ts,
  modified_at,
  ...otherProps
}:
  | ServiceLifecycle.CosmosResource
  | ServicePublication.CosmosResource): Queue.RequestHistoricizationItem => ({
  ...otherProps,
  // eslint-disable-next-line no-underscore-dangle
  modified_at: modified_at ?? DateUtils.unixSecondsToMillis(_ts), // when the service-lifecycle/service-publication record lack of modified_at, the _ts value is used
  // eslint-disable-next-line no-underscore-dangle
  version: _etag as NonEmptyString, // version on service-history record corresponds to the _etag on the service-lifecycle/service-publication record
});

export const toServiceHistory = ({
  modified_at,
  ...service
}: Queue.RequestHistoricizationItem): ServiceHistory => ({
  ...service,
  id: modified_at.toString() as NonEmptyString, // id contains the service-lifecycle/service-publication modified_at/_ts value
  last_update: DateUtils.isoStringfromUnixMillis(modified_at) as NonEmptyString, // last_update contains the service-lifecycle/service-publication  modified_at/_ts ISO String rapresentation
  serviceId: service.id,
});

export const handleQueueItem = (context: Context, queueItem: Json) =>
  pipe(
    queueItem,
    parseIncomingMessage(Queue.RequestHistoricizationItem),
    TE.fromEither,
    TE.map((service) => {
      context.bindings.serviceHistoryDocument = JSON.stringify(
        toServiceHistory(service),
      );
    }),
    TE.getOrElseW((e) => {
      if (e instanceof QueuePermanentError) {
        context.log.error(`Permanent error: ${e.message}`);
        return T.of(void 0);
      }
      throw e;
    }),
  );

export const createRequestHistoricizationHandler = (): ReturnType<
  typeof withJsonInput
> =>
  withJsonInput((context, queueItem) => handleQueueItem(context, queueItem)());
