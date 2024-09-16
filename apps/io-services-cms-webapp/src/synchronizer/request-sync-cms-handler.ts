import { Context } from "@azure/functions";
import {
  Queue,
  ServiceLifecycle,
  ServicePublication,
} from "@io-services-cms/models";
import * as O from "fp-ts/lib/Option";
import * as RA from "fp-ts/lib/ReadonlyArray";
import * as T from "fp-ts/lib/Task";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import { Json } from "io-ts-types";

import { IConfig } from "../config";
import { withJsonInput } from "../lib/azure/misc";
import { QueuePermanentError } from "../utils/errors";
import { parseIncomingMessage } from "../utils/queue-utils";
import { SYNC_FROM_LEGACY } from "../utils/synchronizer";

const toServiceLifecycle =
  (fsmLifecycleClient: ServiceLifecycle.FsmClient, config: IConfig) =>
  (
    state: ServiceLifecycle.ItemType["fsm"]["state"],
    { data, id, modified_at }: Queue.RequestSyncCmsItem,
  ) =>
    pipe(
      id,
      fsmLifecycleClient.fetch,
      TE.chainW(
        flow(
          O.fold(
            () => TE.right(config.LEGACY_SYNC_DEFAULT_TOPIC_ID),
            (currentServiceLifecycle) =>
              TE.right(currentServiceLifecycle.data.metadata.topic_id),
          ),
          TE.map((topic_id) => ({
            ...data,
            metadata: {
              ...data.metadata,
              topic_id,
            },
          })),
        ),
      ),
      TE.map((lifecycleData) => ({
        data: lifecycleData,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fsm: { lastTransition: SYNC_FROM_LEGACY, state: state as any },
        id,
        modified_at,
      })),
    );

const toServicePublication =
  (
    fsmPublicationClient: ServicePublication.FsmClient,
    fsmLifecycleClient: ServiceLifecycle.FsmClient,
    config: IConfig,
  ) =>
  (
    state: ServicePublication.ItemType["fsm"]["state"],
    { data, id, modified_at }: Queue.RequestSyncCmsItem,
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
                        TE.right(
                          currentServiceLifecycle.data.metadata.topic_id,
                        ),
                    ),
                  ),
                ),
              ),
            (currentServicePublication) =>
              TE.right(currentServicePublication.data.metadata.topic_id),
          ),
          TE.map((topic_id) => ({
            ...data,
            metadata: {
              ...data.metadata,
              topic_id,
            },
          })),
        ),
      ),
      TE.map((publicationData) => ({
        data: publicationData,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fsm: { lastTransition: SYNC_FROM_LEGACY, state: state as any },
        id,
        modified_at,
      })),
    );

export const handleQueueItem = (
  context: Context,
  queueItem: Json,
  fsmLifecycleClient: ServiceLifecycle.FsmClient,
  fsmPublicationClient: ServicePublication.FsmClient,
  config: IConfig,
) =>
  pipe(
    queueItem,
    parseIncomingMessage(Queue.RequestSyncCmsItems),
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
              item,
            ),

            TE.chain((serviceLifecycle) =>
              fsmLifecycleClient.override(
                serviceLifecycle.id,
                serviceLifecycle,
                true, // this parameter will preserve the original legacy modified_at date of the item
              ),
            ),
            TE.map((_) => void 0),
          ),
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
                  config,
                )(
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  item.fsm.state as any,
                  item,
                ),
                TE.chain((servicePublication) =>
                  fsmPublicationClient.override(
                    servicePublication.id,
                    servicePublication,
                    true, // this parameter will preserve the original legacy modified_at date of the item
                  ),
                ),
                TE.map((_) => void 0),
              ),
            ),
          ),
        ),
      ),
    ),
    TE.getOrElseW((e) => {
      if (e instanceof QueuePermanentError) {
        context.log.error(`Permanent error: ${e.message}`);
        return T.of(void 0);
      }
      throw e;
    }),
  );

export const createRequestSyncCmsHandler = (
  fsmLifecycleClient: ServiceLifecycle.FsmClient,
  fsmPublicationClient: ServicePublication.FsmClient,
  config: IConfig,
): ReturnType<typeof withJsonInput> =>
  withJsonInput((context, queueItem) =>
    handleQueueItem(
      context,
      queueItem,
      fsmLifecycleClient,
      fsmPublicationClient,
      config,
    )(),
  );
