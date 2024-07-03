import { Context } from "@azure/functions";
import {
  Queue,
  ServiceHistory,
  ServiceLifecycle,
  ServicePublication,
} from "@io-services-cms/models";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import { Json } from "io-ts-types";
import { withJsonInput } from "../lib/azure/misc";

// Method used in on-service-lifecycle-change.ts and on-service-publication-change.ts
// used to build the message to be sent to the request-historicization queue and processed by this handler
export const buildRequestHistoricizationQueueMessage = ({
  _ts,
  _etag,
  ...otherProps
}:
  | ServicePublication.CosmosResource
  | ServiceLifecycle.CosmosResource): Queue.RequestHistoricizationItem => ({
  ...otherProps,
  // eslint-disable-next-line no-underscore-dangle
  last_update: new Date(_ts * 1000).toISOString() as NonEmptyString, // last_update on service-history record corresponds to the _ts on the service-lifecycle/service-publication record
  // eslint-disable-next-line no-underscore-dangle
  version: _etag as NonEmptyString, // version on service-history record corresponds to the _etag on the service-lifecycle/service-publication record
});

const parseIncomingMessage = (
  queueItem: Json
): E.Either<Error, Queue.RequestHistoricizationItem> =>
  pipe(
    queueItem,
    Queue.RequestHistoricizationItem.decode,
    E.mapLeft(flow(readableReport, E.toError))
  );

export const toServiceHistory = (
  service: Queue.RequestHistoricizationItem
): ServiceHistory => ({
  ...service,
  id: new Date(service.last_update).getTime().toString() as NonEmptyString, // last_update contains the service-lifecycle/service-publication _ts value
  serviceId: service.id,
});

export const handleQueueItem = (context: Context, queueItem: Json) =>
  pipe(
    queueItem,
    parseIncomingMessage,
    TE.fromEither,
    TE.mapLeft((_) => new Error("Error while parsing incoming message")), // TODO: map as _permanent_ error
    TE.map((service) => {
      // eslint-disable-next-line functional/immutable-data
      context.bindings.serviceHistoryDocument = JSON.stringify(
        toServiceHistory(service)
      );
    }),
    TE.getOrElse((e) => {
      throw e;
    })
  );

export const createRequestHistoricizationHandler = (): ReturnType<
  typeof withJsonInput
> =>
  withJsonInput((context, queueItem) => handleQueueItem(context, queueItem)());
