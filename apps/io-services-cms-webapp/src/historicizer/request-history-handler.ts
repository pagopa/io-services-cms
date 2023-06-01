import { ServiceLifecycle } from "@io-services-cms/models";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import { Json } from "io-ts-types";
import { Context } from "@azure/functions";
import { withJsonInput } from "../lib/azure/misc";

const parseIncomingMessage = (
  queueItem: Json
): E.Either<Error, ServiceLifecycle.definitions.Service> =>
  pipe(
    queueItem,
    ServiceLifecycle.definitions.Service.decode,
    E.mapLeft(flow(readableReport, E.toError))
  );

export const buildDocument = (service: ServiceLifecycle.definitions.Service) =>
  JSON.stringify({
    ...service,
    id: service.last_update
      ? new Date(service.last_update).getTime().toString()
      : new Date().getTime().toString(),
    serviceId: service.id,
  });

export const handleQueueItem = (context: Context, queueItem: Json) =>
  pipe(
    queueItem,
    parseIncomingMessage,
    TE.fromEither,
    TE.mapLeft((_) => new Error("Error while parsing incoming message")),
    TE.map((service) => {
      // eslint-disable-next-line functional/immutable-data
      context.bindings.serviceHistoryDocument = buildDocument(service);
    }),
    TE.getOrElse((e) => {
      throw e;
    })
  );

export const createRequestHistoryHandler = (): ReturnType<
  typeof withJsonInput
> =>
  withJsonInput((context, queueItem) => handleQueueItem(context, queueItem)());
