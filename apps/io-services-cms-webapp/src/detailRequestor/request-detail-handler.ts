import { Context } from "@azure/functions";
import { Queue, ServiceDetail } from "@io-services-cms/models";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as B from "fp-ts/boolean";
import * as O from "fp-ts/lib/Option";
import * as T from "fp-ts/lib/Task";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { Json } from "io-ts-types";

import { withJsonInput } from "../lib/azure/misc";
import { CosmosHelper } from "../utils/cosmos-helper";
import { QueuePermanentError } from "../utils/errors";
import { parseIncomingMessage } from "../utils/queue-utils";

const PUBLICATION_KIND = "publication";

export const toServiceDetail = (
  service: Queue.RequestDetailItem,
): ServiceDetail => ({
  cms_last_update_ts: service.cms_last_update_ts,
  description: service.data.description,
  id: service.id,
  kind: service.kind,
  metadata: service.data.metadata,
  name: service.data.name,
  organization: service.data.organization,
  require_secure_channel: service.data.require_secure_channel,
});

const getServiceIdOnDetailContainer =
  (serviceDetailCosmosHelper: CosmosHelper) => (serviceId: NonEmptyString) =>
    serviceDetailCosmosHelper.fetchSingleItem(
      {
        parameters: [
          {
            name: "@serviceId",
            value: serviceId,
          },
          {
            name: "@pubKind",
            value: PUBLICATION_KIND,
          },
        ],
        query: `SELECT VALUE c.id FROM c WHERE c.id = @serviceId AND c.kind = @pubKind`,
      },
      NonEmptyString,
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
            () => TE.right(false),
          ),
        ),
      ),
      TE.mapLeft((err) => new Error(`An Error has occurred: ${err.message}`)),
    );

const shouldUpsertServiceDetails =
  (serviceDetailCosmosHelper: CosmosHelper) =>
  (service: Queue.RequestDetailItem): TE.TaskEither<Error, boolean> =>
    pipe(
      service.kind === PUBLICATION_KIND,
      B.fold(
        () =>
          pipe(
            shouldUpsertLifecycleService(serviceDetailCosmosHelper)(service),
          ),
        () => TE.of(true),
      ),
    );

export const handleQueueItem = (
  context: Context,
  serviceDetailCosmosHelper: CosmosHelper,
  queueItem: Json,
) =>
  pipe(
    queueItem,
    parseIncomingMessage(Queue.RequestDetailItem),
    TE.fromEither,
    TE.chain((service) =>
      pipe(
        shouldUpsertServiceDetails(serviceDetailCosmosHelper)(service),
        TE.map(
          B.fold(
            () => void 0,
            () =>
              pipe(
                (context.bindings.serviceDetailDocument = JSON.stringify(
                  toServiceDetail(service),
                )),
              ),
          ),
        ),
        TE.map((_) => void 0),
      ),
    ),
    TE.getOrElse((e) => {
      if (e instanceof QueuePermanentError) {
        context.log.error(`Permanent error: ${e.message}`);
        return T.of(void 0);
      }
      throw e;
    }),
  );

export const createRequestDetailHandler = (
  serviceDetailCosmosHelper: CosmosHelper,
): ReturnType<typeof withJsonInput> =>
  withJsonInput((context, queueItem) =>
    handleQueueItem(context, serviceDetailCosmosHelper, queueItem)(),
  );
