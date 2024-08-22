import { Context } from "@azure/functions";
import {
  Queue,
  ServiceLifecycle,
  ServicePublication,
} from "@io-services-cms/models";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as RA from "fp-ts/lib/ReadonlyArray";
import * as T from "fp-ts/lib/Task";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import { Json } from "io-ts-types";
import { IConfig } from "../config";
import { withJsonInput } from "../lib/azure/misc";
import { SYNC_FROM_LEGACY } from "../utils/synchronizer";
import { PermanentError } from "../utils/errors";

const parseIncomingMessage = (
  queueItem: Json
): E.Either<PermanentError, Queue.RequestSyncCmsItems> =>
  pipe(
    queueItem,
    Queue.RequestSyncCmsItems.decode,
    E.mapLeft(
      flow(
        readableReport,
        (_) => new PermanentError(`Error parsing incoming message: ${_}`)
      )
    )
  );

const toServiceLifecycle =
  (fsmLifecycleClient: ServiceLifecycle.FsmClient, config: IConfig) =>
  (
    state: ServiceLifecycle.ItemType["fsm"]["state"],
    { id, data }: Queue.RequestSyncCmsItem
  ) =>
    pipe(
      id,
      fsmLifecycleClient.fetch,
      TE.chainW(
        flow(
          O.fold(
            () => TE.right(config.LEGACY_SYNC_DEFAULT_TOPIC_ID),
            (currentServiceLifecycle) =>
              TE.right(currentServiceLifecycle.data.metadata.topic_id)
          ),
          TE.map((topic_id) => ({
            ...data,
            metadata: {
              ...data.metadata,
              topic_id,
            },
          }))
        )
      ),
      TE.map((lifecycleData) => ({
        id,
        data: lifecycleData,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fsm: { state: state as any, lastTransition: SYNC_FROM_LEGACY },
      }))
    );

const toServicePublication =
  (
    fsmPublicationClient: ServicePublication.FsmClient,
    fsmLifecycleClient: ServiceLifecycle.FsmClient,
    config: IConfig
  ) =>
  (
    state: ServicePublication.ItemType["fsm"]["state"],
    { id, data }: Queue.RequestSyncCmsItem
  ) =>
    pipe(
      id,
      fsmPublicationClient.getStore().fetch,
      TE.chainW(
        flow(
          O.fold(
            () =>
              pipe(
                id,
                fsmLifecycleClient.fetch,
                TE.chainW(
                  flow(
                    O.fold(
                      () => TE.right(config.LEGACY_SYNC_DEFAULT_TOPIC_ID),
                      (currentServiceLifecycle) =>
                        TE.right(currentServiceLifecycle.data.metadata.topic_id)
                    )
                  )
                )
              ),
            (currentServicePublication) =>
              TE.right(currentServicePublication.data.metadata.topic_id)
          ),
          // eslint-disable-next-line sonarjs/no-identical-functions
          TE.map((topic_id) => ({
            ...data,
            metadata: {
              ...data.metadata,
              topic_id,
            },
          }))
        )
      ),
      TE.map((publicationData) => ({
        id,
        data: publicationData,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fsm: { state: state as any, lastTransition: SYNC_FROM_LEGACY },
      }))
    );

export const handleQueueItem = (
  context: Context,
  queueItem: Json,
  fsmLifecycleClient: ServiceLifecycle.FsmClient,
  fsmPublicationClient: ServicePublication.FsmClient,
  config: IConfig
) =>
  pipe(
    queueItem,
    parseIncomingMessage,
    E.mapLeft(
      (err) =>
        new Error(
          `Error while parsing incoming message, the reason was => ${err.message}`
        )
    ), // TODO: map as _permanent_ error
    TE.fromEither,
    TE.chainW((items) =>
      pipe(
        items,
        RA.filter((item) => item.kind === "LifecycleItemType"),
        RA.traverse(TE.ApplicativePar)((item) =>
          pipe(
            toServiceLifecycle(fsmLifecycleClient, config)(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              item.fsm.state as any,
              item
            ),

            TE.chain((serviceLifecycle) =>
              fsmLifecycleClient.override(serviceLifecycle.id, serviceLifecycle)
            ),
            TE.map((_) => void 0)
          )
        ),
        TE.chainW(() =>
          pipe(
            items,
            RA.filter((item) => item.kind === "PublicationItemType"),
            RA.traverse(TE.ApplicativePar)((item) =>
              pipe(
                toServicePublication(
                  fsmPublicationClient,
                  fsmLifecycleClient,
                  config
                )(
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  item.fsm.state as any,
                  item
                ),
                TE.chain((servicePublication) =>
                  fsmPublicationClient.override(
                    servicePublication.id,
                    servicePublication
                  )
                ),
                TE.map((_) => void 0)
              )
            )
          )
        )
      )
    ),
    TE.getOrElseW((e) => {
      if (e instanceof PermanentError) {
        context.log.error(`Permanent error: ${e.message}`);
        return T.of(void 0);
      }
      throw e;
    })
  );

export const createRequestSyncCmsHandler = (
  fsmLifecycleClient: ServiceLifecycle.FsmClient,
  fsmPublicationClient: ServicePublication.FsmClient,
  config: IConfig
): ReturnType<typeof withJsonInput> =>
  withJsonInput((context, queueItem) =>
    handleQueueItem(
      context,
      queueItem,
      fsmLifecycleClient,
      fsmPublicationClient,
      config
    )()
  );
