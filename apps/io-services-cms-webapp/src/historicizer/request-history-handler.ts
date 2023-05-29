import { ServiceLifecycle } from "@io-services-cms/models";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import { Json } from "io-ts-types";
import { withJsonInput } from "../lib/azure/misc";
import { CosmosClient } from "../lib/clients/cosmos-client";

const parseIncomingMessage = (
  queueItem: Json
): E.Either<Error, ServiceLifecycle.definitions.ServiceResource> =>
  pipe(
    queueItem,
    ServiceLifecycle.definitions.ServiceResource.decode,
    E.mapLeft(flow(readableReport, (_) => new Error(_)))
  );

export const createRequestHistoryHandler = (
  cosmosDbClient: CosmosClient<ServiceLifecycle.definitions.ServiceResource>
): ReturnType<typeof withJsonInput> =>
  withJsonInput((_context, queueItem) =>
    pipe(
      queueItem,
      parseIncomingMessage,
      TE.fromEither,
      TE.mapLeft((_) => new Error("Error while parsing incoming message")),
      TE.chain((service) => cosmosDbClient.save(service.id, service)),
      TE.getOrElse((e) => {
        throw e;
      })
    )()
  );
