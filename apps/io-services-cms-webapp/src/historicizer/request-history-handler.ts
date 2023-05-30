import { ServiceLifecycle } from "@io-services-cms/models";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import { Json } from "io-ts-types";
import { IsoDateFromString } from "@pagopa/ts-commons/lib/dates";
import { withJsonInput } from "../lib/azure/misc";

const parseIncomingMessage = (
  queueItem: Json
): E.Either<Error, ServiceLifecycle.definitions.Service> =>
  pipe(
    queueItem,
    ServiceLifecycle.definitions.Service.decode,
    E.mapLeft(flow(readableReport, (_) => new Error(_)))
  );

export const createRequestHistoryHandler = (): ReturnType<
  typeof withJsonInput
> =>
  withJsonInput((context, queueItem) =>
    pipe(
      queueItem,
      parseIncomingMessage,
      TE.fromEither,
      TE.mapLeft((_) => new Error("Error while parsing incoming message")),
      TE.map((service) => {
        // eslint-disable-next-line functional/immutable-data
        context.bindings.serviceHistoryDocument = JSON.stringify({
          ...service,
          id: pipe(
            service.last_update,
            IsoDateFromString.decode,
            E.fold(
              (_) => undefined,
              (date) => date.getTime().toString()
            )
          ),
          serviceId: service.id,
        });
      }),
      TE.getOrElse((e) => {
        throw e;
      })
    )()
  );
