import { Context } from "@azure/functions";
import { Queue, ServiceDetail } from "@io-services-cms/models";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import * as B from "fp-ts/boolean";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as T from "fp-ts/lib/Task";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import { Json } from "io-ts-types";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { withJsonInput } from "../lib/azure/misc";
import { CosmosHelper } from "../utils/cosmos-helper";
import { PermanentError } from "../utils/errors";

const PUBLICATION_KIND = "publication";

const parseIncomingMessage = (
  queueItem: Json
): E.Either<Error, Queue.RequestDetailItem> =>
  pipe(
    queueItem,
    Queue.RequestDetailItem.decode,
    E.mapLeft(flow(readableReport, E.toError))
  );

export const toServiceDetail = (
  service: Queue.RequestDetailItem
): ServiceDetail => ({
  id: service.id,
  name: service.data.name,
  description: service.data.description,
  require_secure_channel: service.data.require_secure_channel,
  organization: service.data.organization,
  metadata: service.data.metadata,
  cms_last_update_ts: service.cms_last_update_ts,
  kind: service.kind,
});

const getServiceIdOnDetailContainer =
  (serviceDetailCosmosHelper: CosmosHelper) => (serviceId: NonEmptyString) =>
    serviceDetailCosmosHelper.fetchSingleItem(
      {
        query: `SELECT VALUE c.id FROM c WHERE c.id IN ('${serviceId}') AND c.kind == ${PUBLICATION_KIND}`,
      },
      NonEmptyString
    );

const shouldUpsertLifecycleService =
  (serviceDetailCosmosHelper: CosmosHelper) =>
  (service: Queue.RequestDetailItem) =>
    pipe(
      getServiceIdOnDetailContainer(serviceDetailCosmosHelper)(service.id),
      TE.chainW((queryResult) =>
        pipe(
          queryResult,
          O.fold(
            () => TE.right(true),
            () => TE.right(false)
          )
        )
      ),
      TE.mapLeft((err) => new Error(`An Error has occurred: ${err.message}`))
    );

const shouldUpsertServiceDetails =
  (serviceDetailCosmosHelper: CosmosHelper) =>
  (service: Queue.RequestDetailItem): TE.TaskEither<Error, boolean> =>
    pipe(
      service.kind === PUBLICATION_KIND,
      B.fold(
        () =>
          pipe(
            shouldUpsertLifecycleService(serviceDetailCosmosHelper)(service)
          ),
        () => TE.of(true)
      )
    );

export const handleQueueItem = (
  context: Context,
  serviceDetailCosmosHelper: CosmosHelper,
  queueItem: Json
) =>
  pipe(
    queueItem,
    parseIncomingMessage,
    E.mapLeft(
      (e) => new PermanentError(`Error parsing incoming message: ${e.message}`)
    ),
    TE.fromEither,
    TE.chain((service) =>
      pipe(
        shouldUpsertServiceDetails(serviceDetailCosmosHelper)(service),
        TE.map(
          B.fold(
            () => void 0,
            () =>
              pipe(
                // eslint-disable-next-line functional/immutable-data
                (context.bindings.serviceDetailDocument = JSON.stringify(
                  toServiceDetail(service)
                ))
              )
          )
        ),
        TE.map((_) => void 0)
      )
    ),
    TE.getOrElse((e) => {
      if (e instanceof PermanentError) {
        context.log.error(`Permanent error: ${e.message}`);
        return T.of(void 0);
      }
      throw e;
    })
  );

export const createRequestDetailHandler = (
  serviceDetailCosmosHelper: CosmosHelper
): ReturnType<typeof withJsonInput> =>
  withJsonInput((context, queueItem) =>
    handleQueueItem(context, serviceDetailCosmosHelper, queueItem)()
  );
