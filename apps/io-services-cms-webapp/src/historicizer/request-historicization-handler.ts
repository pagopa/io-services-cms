import { Context } from "@azure/functions";
import { Queue, ServiceHistory } from "@io-services-cms/models";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import { Json } from "io-ts-types";
import { withJsonInput } from "../lib/azure/misc";

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
